'use client';

import { useEffect, useCallback } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { TRPCProvider } from '@/trpc/provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GradientOrb } from '@/components/ui/gradient-orb';
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

  const history = useHistoryPagination({ enabled: isSignedIn });
  const computation = useComputationManager({
    enabled: isSignedIn,
    historyItems: history.historyItems,
    onHistoryUpdate: history.updateItem,
  });

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
    history.addOptimisticItem(comp);
    computation.setCurrentComputationId(comp._id);
    computation.trackActiveComputation(comp._id);
  }, [history, computation]);

  return (
    <div className="w-full lg:w-[90%] lg:min-w-[90%] mx-auto min-h-full lg:h-full flex flex-col flex-1">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 lg:min-h-0">
        {/* Left Column: History */}
        <div className="lg:col-span-1 flex flex-col order-3 lg:order-1 lg:min-h-0 w-full flex-1 lg:flex-none">
          <Card className="overflow-hidden flex flex-col flex-1 lg:h-full w-full relative">
            <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40 dark:from-muted/60 dark:to-muted/30 border-b border-border/50 shrink-0 h-[52px] py-2.5 px-3">
              <div className="flex items-center h-full gap-2.5">
                <div className="w-7 h-7 rounded-full gradient-blue flex items-center justify-center neu-raised-sm">
                  <History className="h-3.5 w-3.5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-foreground text-sm font-semibold leading-tight">
                    Computations
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-[10px]">
                    {isSignedIn || isSessionLoading ? `${history.totalHistory} total` : 'Sign in to view'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className={`pt-2 flex-1 overflow-y-auto px-2 ${history.hasMoreHistory ? 'pb-12' : 'pb-2'}`}>
              {isSessionLoading ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <GradientOrb variant="blue" size="md" />
                  <span className="text-[10px] font-medium text-muted-foreground">Loading...</span>
                </div>
              ) : !isSignedIn ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <CalculatorIcon size="lg" />
                  <div className="text-center space-y-1">
                    <p className="text-muted-foreground font-medium text-xs">Sign in to view history</p>
                    <p className="text-muted-foreground/60 text-[10px]">Computations will appear here</p>
                  </div>
                  <Button onClick={handleSignIn} variant="pill" size="pill-sm" className="font-semibold text-xs">
                    <GoogleIcon className="h-3 w-3 mr-1.5" />
                    Sign In
                  </Button>
                </div>
              ) : history.isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center space-y-3 py-8">
                  <GradientOrb variant="blue" size="md" />
                  <span className="text-[10px] font-medium text-muted-foreground">Loading...</span>
                </div>
              ) : history.historyItems.length > 0 ? (
                <div className="space-y-1">
                  {history.historyItems.map((comp) => {
                    const isSelected = comp._id === computation.currentComputationId;
                    const isActive = comp.status === 'pending' || comp.status === 'processing';
                    return (
                      <button
                        key={comp._id}
                        onClick={() => computation.setCurrentComputationId(comp._id)}
                        className={`w-full p-2 rounded-xl transition-all text-left ${
                          isSelected ? 'neu-pressed-sm bg-muted' : 'neu-flat bg-card hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isActive ? (
                            <GradientOrb variant="purple" size="sm" className="w-6 h-6" />
                          ) : (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              comp.mode === 'ai' ? 'gradient-purple' : 'gradient-blue'
                            } ${isSelected ? '' : 'opacity-70'} neu-raised-sm`}>
                              {comp.mode === 'ai' ? (
                                <Sparkles className="h-3 w-3 text-accent-foreground" />
                              ) : (
                                <Calculator className="h-3 w-3 text-secondary-foreground" />
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-foreground block truncate">
                              A={comp.a}, B={comp.b}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {isActive ? 'Processing...' : comp.mode === 'ai' ? 'AI Mode' : 'Classic'}
                            </span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60 shrink-0">
                            {new Date(comp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <CalculatorIcon size="lg" />
                  <p className="text-muted-foreground text-xs font-medium">No computations yet</p>
                </div>
              )}
            </CardContent>
            {history.hasMoreHistory && (
              <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                <div className="bg-gradient-to-t from-card via-card/95 to-transparent h-14 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 p-2 pointer-events-auto">
                  <Button
                    variant="outline"
                    onClick={history.handleLoadMore}
                    disabled={history.isLoadingMore}
                    className="w-full rounded-full font-medium text-xs h-8"
                  >
                    {history.isLoadingMore ? (
                      <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Loading...</>
                    ) : 'Load More'}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Form + Results */}
        <div className="lg:col-span-2 flex flex-col gap-3 order-1 lg:order-2 lg:min-h-0 w-full flex-1 lg:flex-none">
          <div className="shrink-0 w-full">
            <ComputeForm onComputationCreated={handleComputationCreated} />
          </div>

          <div className="flex-1 lg:min-h-0 flex flex-col w-full">
            {computation.currentComputationId ? (
              <>
                {computation.isLoadingCurrent && !computation.currentComputation ? (
                  <Card key="loading" className="overflow-hidden flex-1 w-full animate-fade-in">
                    <CardContent className="flex flex-col items-center justify-center space-y-3 py-10 h-full">
                      <GradientOrb variant="purple" size="md" />
                      <span className="text-xs font-medium text-muted-foreground">Loading...</span>
                    </CardContent>
                  </Card>
                ) : computation.currentComputation ? (
                  <div key={computation.currentComputation._id} className="flex-1 lg:min-h-0 w-full animate-fade-in">
                    <ResultsTable computation={computation.currentComputation} />
                  </div>
                ) : null}
              </>
            ) : (
              <Card key="empty" className="overflow-hidden flex-1 w-full animate-fade-in">
                <CardContent className="flex flex-col items-center justify-center space-y-3 py-10 h-full">
                  <div className="w-12 h-12 rounded-full gradient-blue flex items-center justify-center neu-raised">
                    <Calculator className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Select or submit a computation</span>
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
        <div className="hidden lg:flex fixed top-3 right-3 z-50 flex-col gap-1.5">
          <ThemeToggle />
          <LogoutButton />
        </div>
        <main className="container mx-auto px-3 py-3 flex-1 flex flex-col lg:min-h-0">
          <AppContent />
        </main>
      </div>
    </TRPCProvider>
  );
}
