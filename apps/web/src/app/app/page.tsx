'use client';

import { useState } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Loader2, Calculator, LogOut, Sparkles } from 'lucide-react';
import { useSession, signIn } from '@/lib/auth-client';

export default function AppPage() {
  const [currentComputationId, setCurrentComputationId] = useState<string | null>(null);
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

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

  // Fetch history (only when signed in)
  const { data: history, isLoading: isLoadingHistory } = trpc.computation.getHistory.useQuery(undefined, {
    enabled: isSignedIn,
    refetchInterval: isSignedIn ? 10000 : false, // Refresh history every 10 seconds when signed in
  });

  const handleSignIn = () => {
    signIn.social({ provider: 'google', callbackURL: '/app' });
  };

  const handleComputationCreated = (id: string) => {
    setCurrentComputationId(id);
  };

  const isProcessing = !!currentComputationId && (
    !currentComputation || 
    currentComputation._id !== currentComputationId ||
    (currentComputation.status !== 'completed' && currentComputation.status !== 'failed')
  );

  return (
    <div className="max-w-7xl mx-auto pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column: History (Full Height) */}
        <div className="lg:col-span-1 flex flex-col order-3 lg:order-1">
          <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-primary flex flex-col h-full">
        <CardHeader className="bg-muted border-b border-border/50 shrink-0 h-[70px] py-2 px-4">
          <div className="flex items-center h-full">
            <div className="space-y-0.5">
              <CardTitle className="text-foreground flex items-center gap-1.5 text-base font-black uppercase tracking-widest">
                <History className="h-4 w-4 text-primary" />
                Execution History
              </CardTitle>
              <CardDescription className="text-foreground/60 font-bold text-[9px] uppercase tracking-wider">
                {isSignedIn ? 'Last 10 completed payloads' : 'Sign in to view your computation history'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex-1 overflow-y-auto">
          {!isSignedIn ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                <Calculator className="h-10 w-10 text-primary/40 mx-auto" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-foreground/60 font-bold text-xs uppercase tracking-wider">
                  Sign in to view your computation history
                </p>
                <p className="text-foreground/40 text-[9px] font-black uppercase tracking-widest">
                  Your completed computations will appear here
                </p>
              </div>
              <Button
                onClick={handleSignIn}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[9px] px-6 py-4 h-auto"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Sign In with Google
              </Button>
            </div>
          ) : isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="grid grid-cols-1 gap-0.5">
              {history
                .slice(0, 10)
                .map((computation) => {
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
                          <span className="text-[9px] text-foreground/30 uppercase tracking-wide">
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
                        <span className="text-[9px] text-foreground/30 uppercase tracking-wide">
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
              <div className="p-4 bg-muted/30 rounded-xl border border-border/30">
                <Calculator className="h-10 w-10 text-primary/40 mx-auto" />
              </div>
              <p className="text-foreground/40 text-[9px] font-black uppercase tracking-widest text-center">
                No computations yet. Run your first computation above!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
        </div>

        {/* Right Column: Computation Form + Results */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 order-1 lg:order-2">
          {/* Compute Form */}
          <ComputeForm 
            onComputationCreated={handleComputationCreated} 
            isProcessing={isProcessing}
          />

          {/* Computation Results */}
          {currentComputationId ? (
            <div>
              {isLoadingCurrent && !currentComputation ? (
                <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary animate-pulse">
                  <CardContent className="py-8 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">Initializing Engine Pipeline...</span>
                  </CardContent>
                </Card>
              ) : currentComputation ? (
                <ResultsTable computation={currentComputation} />
              ) : null}
            </div>
          ) : (
            <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary/30">
              <CardContent className="py-16 flex flex-col items-center justify-center space-y-3">
                <Calculator className="h-12 w-12 text-foreground/20" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">Select a computation from history or run a new one</span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
