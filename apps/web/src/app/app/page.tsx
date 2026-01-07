'use client';

import { useState } from 'react';
import { ComputeForm } from '@/components/compute-form';
import { ResultsTable } from '@/components/results-table';
import { trpc } from '@/trpc/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Loader2 } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Compute Form */}
      <ComputeForm onComputationCreated={handleComputationCreated} />

      {/* Current Computation Results */}
      {currentComputationId && (
        <div>
          {isLoadingCurrent && !currentComputation ? (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="py-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-violet-400 animate-spin mr-2" />
                <span className="text-slate-400">Loading computation...</span>
              </CardContent>
            </Card>
          ) : currentComputation ? (
            <ResultsTable computation={currentComputation} />
          ) : null}
        </div>
      )}

      {/* Computation History */}
      {history && history.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5 text-violet-400" />
              Recent Computations
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your last 10 computations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {history
                  .filter(c => c._id !== currentComputationId)
                  .slice(0, 5)
                  .map((computation) => (
                    <button
                      key={computation._id}
                      onClick={() => setCurrentComputationId(computation._id)}
                      className="w-full p-4 rounded-lg bg-slate-900/50 border border-slate-700 hover:border-violet-500/50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium">
                            A = {computation.a}, B = {computation.b}
                          </span>
                          <span className="text-slate-500 text-sm ml-3">
                            {computation.mode === 'ai' ? '✨ AI' : '🔢 Classic'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            computation.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400'
                              : computation.status === 'processing'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}>
                            {computation.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {new Date(computation.createdAt).toLocaleTimeString()}
                          </span>
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

