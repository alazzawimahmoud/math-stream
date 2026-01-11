'use client';

import { useEffect, useCallback } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { TRPCProvider } from '@/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2, Calculator, Sparkles } from 'lucide-react';
import { CalculatorIcon } from '@/components/icons/calculator';
import { GoogleIcon } from '@/components/icons/google';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { useSession, signIn } from '@/lib/auth-client';
import { useHistoryPagination } from '@/hooks/use-history-pagination';
import { useComputationManager } from '@/hooks/use-computation-manager';
import type { Computation } from '@mathstream/shared';

function AppContent() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const isSignedIn = !!session?.user;

  // History pagination hook
  const history = useHistoryPagination({ enabled: isSignedIn });

  // Computation manager hook
  const computation = useComputationManager({
    enabled: isSignedIn,
    historyItems: history.historyItems,
    onHistoryUpdate: history.updateItem,
  });

  // Clear state when user signs out
  useEffect(() => {
    if (!isSignedIn) {
      history.reset();
      computation.reset();
    }
  }, [isSignedIn, history, computation]);

  const handleSignIn = useCallback(() => {
    signIn.social({ provider: 'google', callbackURL: '/' });
  }, []);

  const handleComputationCreated = useCallback((comp: Computation) => {
    // Add to list immediately (optimistic update)
    history.addOptimisticItem(comp);
    
    // Select the new computation to show in Computation Engine
    computation.setCurrentComputationId(comp._id);
    
    // Track as active for SSE updates
    computation.trackActiveComputation(comp._id);
  }, [history, computation]);

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
                    {isSignedIn || isSessionLoading ? `${history.totalHistory} payloads` : 'Sign in to view computations'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`pt-2 sm:pt-3 flex-1 overflow-y-auto px-2 sm:px-3 ${history.hasMoreHistory ? 'pb-14 sm:pb-16' : ''}`}>
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
              ) : history.isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <Loader2 className="h-6 w-6 text-foreground/20 animate-spin" />
                  <span className="text-[9px] font-black uppercase text-foreground/40">Loading...</span>
                </div>
              ) : history.historyItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-0.5">
                  {history.historyItems.map((comp) => {
                    const isSelected = comp._id === computation.currentComputationId;
                    const isActive = comp.status === 'pending' || comp.status === 'processing';
                    return (
                      <button
                        key={comp._id}
                        onClick={() => computation.setCurrentComputationId(comp._id)}
                        className={`w-full p-1.5 sm:p-3 rounded-md sm:rounded-lg transition-all text-left group ${
                          isSelected ? 'bg-foreground/10' : 'hover:bg-foreground/5'
                        }`}
                      >
                        {/* Mobile Layout */}
                        <div className="flex sm:hidden items-center gap-1.5">
                          {isActive ? (
                            <Loader2 className="h-3 w-3 text-foreground animate-spin shrink-0" />
                          ) : comp.mode === 'ai' ? (
                            <Sparkles className={`h-3 w-3 transition-colors shrink-0 ${isSelected ? 'text-foreground' : 'text-foreground/40'}`} />
                          ) : (
                            <Calculator className={`h-3 w-3 transition-colors shrink-0 ${isSelected ? 'text-foreground' : 'text-foreground/40'}`} />
                          )}
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="text-[10px] text-foreground font-medium truncate">
                              A={comp.a}, B={comp.b}
                            </span>
                          </div>
                          <span className="text-[8px] text-foreground/30 shrink-0">
                            {new Date(comp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden sm:flex items-center gap-3">
                          {isActive ? (
                            <Loader2 className="h-3.5 w-3.5 text-foreground animate-spin shrink-0" />
                          ) : comp.mode === 'ai' ? (
                            <Sparkles className={`h-3.5 w-3.5 transition-colors shrink-0 ${isSelected ? 'text-foreground' : 'text-foreground/40'}`} />
                          ) : (
                            <Calculator className={`h-3.5 w-3.5 transition-colors shrink-0 ${isSelected ? 'text-foreground' : 'text-foreground/40'}`} />
                          )}
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-xs text-foreground font-medium leading-tight truncate">
                              A = {comp.a}
                            </span>
                            <span className="text-xs text-foreground font-medium leading-tight truncate">
                              B = {comp.b}
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="text-[10px] text-foreground/40 font-medium">
                              {new Date(comp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[9px] text-foreground/30 uppercase ">
                              {isActive ? 'Processing' : comp.mode === 'ai' ? 'AI' : 'Classic'}
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
            {history.hasMoreHistory && (
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                <div className="bg-gradient-to-t from-card via-card/95 to-transparent h-16 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-auto">
                  <Button
                    variant="secondary"
                    onClick={history.handleLoadMore}
                    disabled={history.isLoadingMore}
                    className="w-full text-[10px] font-black uppercase bg-card hover:bg-muted text-foreground/70 hover:text-foreground border border-border shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-200"
                  >
                    {history.isLoadingMore ? (
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
            {computation.currentComputationId ? (
              <>
                {computation.isLoadingCurrent && !computation.currentComputation ? (
                  <Card key="loading" className="bg-card border-0 shadow-xl shadow-black/15 overflow-hidden flex-1 w-full animate-fade-in">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 py-12 h-full">
                      <Loader2 className="h-12 w-12 text-foreground/20 animate-spin" />
                      <span className="text-[9px] font-black uppercase  text-foreground/40">Loading Computation...</span>
                    </CardContent>
                  </Card>
                ) : computation.currentComputation ? (
                  <div key={computation.currentComputation._id} className="flex-1 lg:min-h-0 w-full animate-fade-in">
                    <ResultsTable computation={computation.currentComputation} />
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
