'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { trpc } from '@/trpc/client';
import { TRPCProvider } from '@/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2, Calculator, Sparkles } from 'lucide-react';
import { CalculatorIcon } from '@/components/icons/calculator';
import { GoogleIcon } from '@/components/icons/google';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { useSession, signIn } from '@/lib/auth-client';
import { useComputationSubscription, type ComputationUpdate } from '@/hooks/use-computation-subscription';
import { useActiveComputationsSubscription } from '@/hooks/use-active-computations-subscription';
import type { Computation } from '@mathstream/shared';

function AppContent() {
  const [currentComputationId, setCurrentComputationId] = useState<string | null>(null);
  const [activeComputationIds, setActiveComputationIds] = useState<Set<string>>(new Set());
  // Track optimistically added items separately (using ref to avoid triggering effects)
  const optimisticIdsRef = useRef<Set<string>>(new Set());
  const { data: session, isPending: isSessionLoading } = useSession();
  const isSignedIn = !!session?.user;

  // Pagination state for history (declared early so it can be used in useMemo)
  const [historyItems, setHistoryItems] = useState<Computation[]>([]);
  const [historySkip, setHistorySkip] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalHistory, setTotalHistory] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const HISTORY_LIMIT = 20;

  // Clear computation and history when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      setCurrentComputationId(null);
      setActiveComputationIds(new Set());
      optimisticIdsRef.current = new Set();
      setHistoryItems([]);
      setHistorySkip(0);
      setHasMoreHistory(false);
      setTotalHistory(0);
    }
  }, [isSignedIn]);

  // Check if current computation is active (needs live updates)
  const isCurrentComputationActive = currentComputationId ? activeComputationIds.has(currentComputationId) : false;

  // Fetch current computation from tRPC (for initial load and completed computations)
  const { data: trpcComputation, isLoading: isLoadingCurrent } = trpc.computation.getStatus.useQuery(
    { id: currentComputationId! },
    {
      enabled: !!currentComputationId && isSignedIn && !isCurrentComputationActive,
    }
  );

  // Subscribe to SSE updates for the currently selected active computation (for detailed view)
  const { data: sseUpdate } = useComputationSubscription(
    isCurrentComputationActive ? currentComputationId : null,
    {
      enabled: isSignedIn && isCurrentComputationActive,
    }
  );

  // Subscribe to SSE updates for ALL active computations (for list updates)
  // This ensures computations update in the list even when not selected
  const handleActiveComputationUpdate = useCallback((update: ComputationUpdate) => {
    // Update the history items list with the new status
    setHistoryItems(prev =>
      prev.map(item =>
        item._id === update.computationId
          ? { ...item, status: update.status, results: update.results }
          : item
      )
    );

    // Remove from active set when completed
    if (update.status === 'completed' || update.status === 'failed') {
      setActiveComputationIds(prev => {
        const next = new Set(prev);
        next.delete(update.computationId);
        return next;
      });
    }
  }, []);

  useActiveComputationsSubscription(activeComputationIds, {
    enabled: isSignedIn,
    onUpdate: handleActiveComputationUpdate,
  });

  // Combine tRPC data and SSE updates
  const currentComputation = useMemo(() => {
    if (sseUpdate && currentComputationId === sseUpdate.computationId) {
      // Use SSE data for active computations
      return {
        _id: sseUpdate.computationId,
        status: sseUpdate.status,
        results: sseUpdate.results,
        totalProgress: sseUpdate.totalProgress,
        fromCache: false,
        // These fields are not in SSE updates, but we have them from the history
        a: historyItems.find(h => h._id === sseUpdate.computationId)?.a ?? 0,
        b: historyItems.find(h => h._id === sseUpdate.computationId)?.b ?? 0,
        mode: historyItems.find(h => h._id === sseUpdate.computationId)?.mode ?? 'classic',
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Computation & { totalProgress: number; fromCache: boolean };
    }
    return trpcComputation ?? null;
  }, [sseUpdate, trpcComputation, currentComputationId, historyItems]);


  // Fetch history (only when signed in)
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = trpc.computation.getHistory.useQuery(
    { limit: HISTORY_LIMIT, skip: 0 },
    {
      enabled: isSignedIn,
      refetchInterval: isSignedIn ? 10000 : false, // Refresh history every 10 seconds when signed in
    }
  );

  // Update local state when history data changes, merging with optimistic updates
  useEffect(() => {
    if (historyData) {
      setHistoryItems(prev => {
        // Get IDs of items from server
        const serverIds = new Set(historyData.computations.map(c => c._id));
        
        // Remove items from optimistic tracking once they appear in server data
        for (const id of serverIds) {
          optimisticIdsRef.current.delete(id);
        }
        
        // Keep any optimistic items that aren't in server data yet
        const optimisticItems = prev.filter(
          item => !serverIds.has(item._id) && optimisticIdsRef.current.has(item._id)
        );
        
        // Merge: optimistic items first, then server data
        return [...optimisticItems, ...historyData.computations];
      });
      setHasMoreHistory(historyData.hasMore);
      setTotalHistory(prev => Math.max(prev, historyData.total));
      setHistorySkip(historyData.computations.length);
    }
  }, [historyData]);

  // Load more history items
  const loadMoreMutation = trpc.computation.getHistory.useQuery(
    { limit: HISTORY_LIMIT, skip: historySkip },
    { enabled: false }
  );

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const result = await loadMoreMutation.refetch();
    if (result.data) {
      setHistoryItems(prev => [...prev, ...result.data.computations]);
      setHasMoreHistory(result.data.hasMore);
      setHistorySkip(prev => prev + result.data.computations.length);
    }
    setIsLoadingMore(false);
  };

  const handleSignIn = () => {
    signIn.social({ provider: 'google', callbackURL: '/' });
  };

  const handleComputationCreated = (computation: Computation) => {
    // Add to list immediately (optimistic update)
    setHistoryItems(prev => [computation, ...prev]);
    setTotalHistory(prev => prev + 1);
    
    // Select the new computation to show in Computation Engine
    setCurrentComputationId(computation._id);
    
    // Track as optimistically added (persists until server confirms)
    optimisticIdsRef.current.add(computation._id);
    
    // Track as active for polling
    setActiveComputationIds(prev => new Set(prev).add(computation._id));
  };

  return (
    <div className="w-full lg:w-[80%] lg:min-w-[80%] mx-auto min-h-full lg:h-full flex flex-col flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 flex-1 lg:min-h-0">
        {/* Left Column: History (Full Height) */}
        <div className="lg:col-span-1 flex flex-col order-3 lg:order-1 lg:min-h-0 w-full flex-1 lg:flex-none">
          <Card className="bg-card border-0 shadow-xl shadow-black/15 overflow-hidden flex flex-col flex-1 lg:h-full w-full relative">
        <CardHeader className="bg-muted border-b border-border/50 shrink-0 h-[44px] sm:h-[72px] py-1 sm:py-1.5 px-2 sm:px-3">
          <div className="flex items-center h-full gap-1 sm:gap-1.5">
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            <div className="space-y-0">
              <CardTitle className="text-foreground text-sm sm:text-base font-black uppercase">
                Computations
              </CardTitle>
              <CardDescription className="text-foreground/60 font-bold text-[8px] sm:text-[9px] uppercase">
                {isSignedIn || isSessionLoading ? `${totalHistory} payloads` : 'Sign in to view computations'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`pt-2 sm:pt-3 flex-1 overflow-y-auto px-2 sm:px-3 ${hasMoreHistory ? 'pb-14 sm:pb-16' : ''}`}>
          {isSessionLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="h-6 w-6 text-foreground/20 animate-spin" />
              <span className="text-[9px] font-black uppercase text-foreground/40">Loading...</span>
            </div>
          ) : !isSignedIn ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CalculatorIcon size="lg" />
              <div className="text-center space-y-1.5">
                <p className="text-foreground/60 font-bold text-xs uppercase ">
                  Sign in to view your computation history
                </p>
                <p className="text-foreground/40 text-[9px] font-black uppercase ">
                  Your completed computations will appear here
                </p>
              </div>
              <Button
                onClick={handleSignIn}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[10px] px-6 py-2"
              >
                <GoogleIcon className="h-3.5 w-3.5 mr-1.5" />
                Sign In
              </Button>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-8">
              <Loader2 className="h-6 w-6 text-foreground/20 animate-spin" />
              <span className="text-[9px] font-black uppercase text-foreground/40">Loading...</span>
            </div>
          ) : historyItems && historyItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-0.5">
              {historyItems.map((computation) => {
                  const isSelected = computation._id === currentComputationId;
                  const isActive = computation.status === 'pending' || computation.status === 'processing';
                  return (
                  <button
                    key={computation._id}
                    onClick={() => setCurrentComputationId(computation._id)}
                    className={`w-full p-1.5 sm:p-3 rounded-md sm:rounded-lg transition-all text-left group ${
                      isSelected
                        ? 'bg-foreground/10'
                        : 'hover:bg-foreground/5'
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="flex sm:hidden items-center gap-1.5">
                      {isActive ? (
                        <Loader2 className="h-3 w-3 text-foreground animate-spin shrink-0" />
                      ) : computation.mode === 'ai' ? (
                        <Sparkles className={`h-3 w-3 transition-colors shrink-0 ${
                          isSelected ? 'text-foreground' : 'text-foreground/40'
                        }`} />
                      ) : (
                        <Calculator className={`h-3 w-3 transition-colors shrink-0 ${
                          isSelected ? 'text-foreground' : 'text-foreground/40'
                        }`} />
                      )}
                      <div className="flex-1 min-w-0 flex items-center gap-2">
                        <span className="text-[10px] text-foreground font-medium truncate">
                          A={computation.a}, B={computation.b}
                        </span>
                      </div>
                      <span className="text-[8px] text-foreground/30 shrink-0">
                        {new Date(computation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center gap-3">
                      {isActive ? (
                        <Loader2 className="h-3.5 w-3.5 text-foreground animate-spin shrink-0" />
                      ) : computation.mode === 'ai' ? (
                        <Sparkles className={`h-3.5 w-3.5 transition-colors shrink-0 ${
                          isSelected ? 'text-foreground' : 'text-foreground/40'
                        }`} />
                      ) : (
                        <Calculator className={`h-3.5 w-3.5 transition-colors shrink-0 ${
                          isSelected ? 'text-foreground' : 'text-foreground/40'
                        }`} />
                      )}
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <span className="text-xs text-foreground font-medium leading-tight truncate">
                          A = {computation.a}
                        </span>
                        <span className="text-xs text-foreground font-medium leading-tight truncate">
                          B = {computation.b}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-[10px] text-foreground/40 font-medium">
                          {new Date(computation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[9px] text-foreground/30 uppercase ">
                          {isActive ? 'Processing' : computation.mode === 'ai' ? 'AI' : 'Classic'}
                        </span>
                      </div>
                    </div>
                  </button>
                  );
                })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CalculatorIcon size="lg" />
              <p className="text-foreground/40 text-[9px] font-black uppercase  text-center">
                No computations yet.
              </p>
            </div>
          )}
        </CardContent>
        {/* Floating Load More Button */}
        {hasMoreHistory && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <div className="bg-gradient-to-t from-card via-card/95 to-transparent h-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto">
              <Button
                variant="secondary"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full text-[10px] font-black uppercase bg-card hover:bg-muted text-foreground/70 hover:text-foreground border border-border shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-200"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
        </div>

        {/* Right Column: Computation Form + Results */}
        <div className="lg:col-span-2 flex flex-col gap-2 sm:gap-3 order-1 lg:order-2 lg:min-h-0 w-full flex-1 lg:flex-none">
          {/* Compute Form */}
          <div className="shrink-0 w-full">
            <ComputeForm onComputationCreated={handleComputationCreated} />
          </div>

          {/* Computation Results */}
          <div className="flex-1 lg:min-h-0 flex flex-col w-full">
            {currentComputationId ? (
              <>
                {isLoadingCurrent && !currentComputation ? (
                  <Card key="loading" className="bg-card border-0 shadow-xl shadow-black/15 overflow-hidden flex-1 w-full animate-fade-in">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 h-full">
                      <Loader2 className="h-12 w-12 text-foreground/20 animate-spin" />
                      <span className="text-[9px] font-black uppercase  text-foreground/40">Loading Computation...</span>
                    </CardContent>
                  </Card>
                ) : currentComputation ? (
                  <div key={currentComputation._id} className="flex-1 lg:min-h-0 w-full animate-fade-in">
                    <ResultsTable computation={currentComputation} />
                  </div>
                ) : null}
              </>
            ) : (
              <Card key="empty" className="bg-card border-0 shadow-xl shadow-black/15 overflow-hidden flex-1 w-full animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 h-full">
                  <CalculatorIcon size="lg" />
                  <span className="text-[9px] font-black uppercase  text-foreground/40">Select a computation or submit a new one</span>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <TRPCProvider>
      <div className="min-h-screen lg:h-screen bg-background flex flex-col relative">
        {/* Theme Toggle & Logout - large screens only (shows in header on medium and below) */}
        <div className="hidden lg:flex fixed top-4 right-4 z-50 flex-col gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
        <main className="container mx-auto px-2 py-2 sm:px-4 sm:py-4 flex-1 flex flex-col lg:min-h-0">
          <AppContent />
        </main>
      </div>
    </TRPCProvider>
  );
}
