'use client';

import { useState } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2, Calculator } from 'lucide-react';

export default function AppPage() {
  const [currentComputationId, setCurrentComputationId] = useState<string | null>(null);

  // Fetch current computation with polling
  const { data: currentComputation, isLoading: isLoadingCurrent } = trpc.computation.getStatus.useQuery(
    { id: currentComputationId! },
    {
      enabled: !!currentComputationId,
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

  // Fetch history
  const { data: history, isLoading: isLoadingHistory } = trpc.computation.getHistory.useQuery(undefined, {
    refetchInterval: 10000, // Refresh history every 10 seconds
  });

  const handleComputationCreated = (id: string) => {
    setCurrentComputationId(id);
  };

  const isProcessing = !!currentComputationId && (
    !currentComputation || 
    currentComputation._id !== currentComputationId ||
    (currentComputation.status !== 'completed' && currentComputation.status !== 'failed')
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Compute Form */}
      <ComputeForm 
        onComputationCreated={handleComputationCreated} 
        isProcessing={isProcessing}
      />

      {/* Current Computation Results */}
      {currentComputationId && (
        <div>
          {isLoadingCurrent && !currentComputation ? (
            <Card className="bg-card border-border shadow-sm overflow-hidden border-t-4 border-t-secondary animate-pulse">
              <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 text-secondary animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Initializing Engine Pipeline...</span>
              </CardContent>
            </Card>
          ) : currentComputation ? (
            <ResultsTable computation={currentComputation} />
          ) : null}
        </div>
      )}

      {/* Computation History */}
      {history && history.length > 0 && (
        <Card className="bg-card border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
          <CardHeader className="bg-muted border-b border-border/50">
            <CardTitle className="text-foreground flex items-center gap-2 text-lg font-black uppercase tracking-widest">
              <History className="h-5 w-5 text-primary" />
              Execution History
            </CardTitle>
            <CardDescription className="text-foreground/60 font-bold text-[10px] uppercase tracking-wider">
              Last 10 completed payloads
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {history
                  .filter(c => c._id !== currentComputationId)
                  .slice(0, 5)
                  .map((computation) => (
                    <button
                      key={computation._id}
                      onClick={() => setCurrentComputationId(computation._id)}
                      className="w-full p-5 rounded-2xl bg-muted/30 border border-border/30 hover:border-primary/50 hover:bg-muted/50 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <div className="p-2.5 bg-card rounded-xl border border-border/50 group-hover:border-primary/30 transition-all group-hover:scale-110">
                            <Calculator className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-foreground font-black uppercase tracking-[0.1em] text-sm">
                              A = {computation.a} , B = {computation.b}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">
                                {computation.mode === 'ai' ? '✨ AI Enhanced Payload' : '🔢 Standard Mathematical Model'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm border border-transparent ${
                              computation.status === 'completed' 
                                ? 'bg-secondary/10 text-secondary border-secondary/20'
                                : computation.status === 'processing'
                                ? 'bg-accent/10 text-accent border-accent/20'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {computation.status}
                            </span>
                            <span className="text-[9px] text-foreground/20 font-black uppercase tracking-tighter">
                              {new Date(computation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
