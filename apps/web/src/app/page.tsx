'use client';

import { useState, useEffect } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { trpc } from '@/trpc/client';
import { TRPCProvider } from '@/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2, Calculator, Sparkles } from 'lucide-react';
import { CalculatorIcon } from '@/components/icons/calculator';
import { GoogleIcon } from '@/components/icons/google';
import { useSession, signIn } from '@/lib/auth-client';
import type { Computation } from '@mathstream/shared';

function AppContent() {
  const [currentComputationId, setCurrentComputationId] = useState<string | null>(null);
  const [activeComputationId, setActiveComputationId] = useState<string | null>(null);
  const { data: session, isPending: isSessionLoading } = useSession();
  const isSignedIn = !!session?.user;

  // Clear computation and history when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      setCurrentComputationId(null);
      setActiveComputationId(null);
      setHistoryItems([]);
      setHistorySkip(0);
      setHasMoreHistory(false);
      setTotalHistory(0);
    }
  }, [isSignedIn]);

  // Fetch current computation with polling
  const { data: currentComputation, isLoading: isLoadingCurrent } = trpc.computation.getStatus.useQuery(
    { id: currentComputationId! },
    {
      enabled: !!currentComputationId && isSignedIn,
      refetchInterval: (query) => {
        // Stop polling when computation is complete or from cache
        const data = query.state.data;
        if (data?.status === 'completed' || data?.fromCache) {
          return false;
        }
        return 500; // Poll every 500ms
      },
    }
  );

  // Clear active computation when it completes
  useEffect(() => {
    if (activeComputationId && currentComputation && 
        currentComputation._id === activeComputationId &&
        (currentComputation.status === 'completed' || currentComputation.status === 'failed')) {
      setActiveComputationId(null);
    }
  }, [activeComputationId, currentComputation]);

  // Pagination state for history
  const [historyItems, setHistoryItems] = useState<Computation[]>([]);
  const [historySkip, setHistorySkip] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalHistory, setTotalHistory] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const HISTORY_LIMIT = 20;

  // Fetch history (only when signed in)
  const { data: historyData, isLoading: isLoadingHistory, refetch: refetchHistory } = trpc.computation.getHistory.useQuery(
    { limit: HISTORY_LIMIT, skip: 0 },
    {
      enabled: isSignedIn,
      refetchInterval: isSignedIn ? 10000 : false, // Refresh history every 10 seconds when signed in
    }
  );

  // Update local state when initial history data changes
  useEffect(() => {
    if (historyData) {
      setHistoryItems(historyData.computations);
      setHasMoreHistory(historyData.hasMore);
      setTotalHistory(historyData.total);
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

  const handleComputationCreated = (id: string) => {
    setCurrentComputationId(id);
    setActiveComputationId(id); // Track this as an active computation
  };

  // Only show processing for actively running computations (not history views)
  const isProcessing = !!activeComputationId && (
    !currentComputation || 
    currentComputation._id !== activeComputationId ||
    (currentComputation.status !== 'completed' && currentComputation.status !== 'failed')
  );

  return (
    <div className="w-full lg:w-[80%] lg:min-w-[80%] mx-auto lg:h-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 lg:flex-1 lg:min-h-0">
        {/* Left Column: History (Full Height) */}
        <div className="lg:col-span-1 flex flex-col order-3 lg:order-1 lg:min-h-0 w-full">
          <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-primary flex flex-col lg:h-full w-full relative">
        <CardHeader className="bg-muted border-b border-border/50 shrink-0 h-[56px] py-1.5 px-3">
          <div className="flex items-center h-full">
            <div className="space-y-0.5">
              <CardTitle className="text-foreground flex items-center gap-1.5 text-base font-black uppercase">
                <History className="h-4 w-4 text-primary" />
                Past Computations
              </CardTitle>
              <CardDescription className="text-foreground/60 font-bold text-[9px] uppercase ">
                {isSignedIn || isSessionLoading ? `${totalHistory} completed payloads` : 'Sign in to view your computation history'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className={`pt-3 lg:flex-1 lg:overflow-y-auto px-3 ${hasMoreHistory ? 'pb-16' : ''}`}>
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
                  return (
                  <button
                    key={computation._id}
                    onClick={() => setCurrentComputationId(computation._id)}
                    className={`w-full p-2.5 sm:p-3 rounded-lg transition-all text-left group ${
                      isSelected
                        ? 'bg-primary/5 border-l-2 border-l-primary'
                        : 'bg-muted/20 hover:bg-muted/30 border-l-2 border-l-transparent'
                    }`}
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col sm:hidden gap-1.5">
                      <div className="flex items-start gap-2">
                        {computation.mode === 'ai' ? (
                          <Sparkles className={`h-3.5 w-3.5 transition-colors shrink-0 mt-0.5 ${
                            isSelected ? 'text-accent' : 'text-foreground/40'
                          }`} />
                        ) : (
                          <Calculator className={`h-3.5 w-3.5 transition-colors shrink-0 mt-0.5 ${
                            isSelected ? 'text-primary' : 'text-foreground/40'
                          }`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-foreground font-medium leading-tight">
                              A = {computation.a}
                            </span>
                            <span className="text-xs text-foreground font-medium leading-tight">
                              B = {computation.b}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[10px] text-foreground/40 font-medium">
                            {new Date(computation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[9px] text-foreground/30 uppercase ">
                            {computation.mode === 'ai' ? 'AI' : 'Classic'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center gap-3">
                      {computation.mode === 'ai' ? (
                        <Sparkles className={`h-3.5 w-3.5 transition-colors shrink-0 ${
                          isSelected ? 'text-accent' : 'text-foreground/40'
                        }`} />
                      ) : (
                        <Calculator className={`h-3.5 w-3.5 transition-colors shrink-0 ${
                          isSelected ? 'text-primary' : 'text-foreground/40'
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
                          {computation.mode === 'ai' ? 'AI' : 'Classic'}
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
        <div className="lg:col-span-2 flex flex-col gap-3 order-1 lg:order-2 lg:min-h-0 w-full">
          {/* Compute Form */}
          <div className="shrink-0 w-full">
            <ComputeForm 
              onComputationCreated={handleComputationCreated} 
              isProcessing={isProcessing}
            />
          </div>

          {/* Computation Results */}
          <div className="lg:flex-1 lg:min-h-0 flex flex-col w-full">
            {currentComputationId ? (
              <>
                {isLoadingCurrent && !currentComputation ? (
                  <Card key="loading" className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary/30 lg:flex-1 w-full animate-fade-in">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 lg:h-full">
                      <Loader2 className="h-12 w-12 text-foreground/20 animate-spin" />
                      <span className="text-[9px] font-black uppercase  text-foreground/40">Loading Computation...</span>
                    </CardContent>
                  </Card>
                ) : currentComputation ? (
                  <div key={currentComputation._id} className="lg:flex-1 lg:min-h-0 w-full animate-fade-in">
                    <ResultsTable computation={currentComputation} />
                  </div>
                ) : null}
              </>
            ) : (
              <Card key="empty" className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary/30 lg:flex-1 w-full animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 lg:h-full">
                  <CalculatorIcon size="lg" />
                  <span className="text-[9px] font-black uppercase  text-foreground/40">Select a computation from history or run a new one</span>
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
      <div className="min-h-screen lg:h-screen bg-background flex flex-col">
        <main className="container mx-auto px-4 py-4 flex-1 lg:flex lg:flex-col lg:min-h-0">
          <AppContent />
        </main>
      </div>
    </TRPCProvider>
  );
}
