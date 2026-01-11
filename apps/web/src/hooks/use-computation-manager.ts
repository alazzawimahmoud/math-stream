'use client';

import { useState, useCallback, useMemo } from 'react';
import { trpc } from '@/trpc/client';
import { useComputationSubscription } from './use-computation-subscription';
import { useActiveComputationsSubscription } from './use-active-computations-subscription';
import type { ComputationUpdate } from '@/types/computation';
import type { Computation } from '@mathstream/shared';

interface UseComputationManagerOptions {
  enabled: boolean;
  historyItems: Computation[];
  onHistoryUpdate: (computationId: string, updates: Partial<Computation>) => void;
}

export function useComputationManager({
  enabled,
  historyItems,
  onHistoryUpdate,
}: UseComputationManagerOptions) {
  const [currentComputationId, setCurrentComputationId] = useState<string | null>(null);
  const [activeComputationIds, setActiveComputationIds] = useState<Set<string>>(new Set());

  // Check if current computation is active (needs live updates)
  const isCurrentComputationActive = currentComputationId
    ? activeComputationIds.has(currentComputationId)
    : false;

  // Fetch current computation from tRPC (for initial load and completed computations)
  const { data: trpcComputation, isLoading: isLoadingCurrent } = trpc.computation.getStatus.useQuery(
    { id: currentComputationId! },
    {
      enabled: !!currentComputationId && enabled && !isCurrentComputationActive,
    }
  );

  // Subscribe to SSE updates for the currently selected active computation
  const { data: sseUpdate } = useComputationSubscription(
    isCurrentComputationActive ? currentComputationId : null,
    {
      enabled: enabled && isCurrentComputationActive,
    }
  );

  // Handle updates from active computations (for list updates)
  const handleActiveComputationUpdate = useCallback(
    (update: ComputationUpdate) => {
      // Update the history items list with the new status
      onHistoryUpdate(update.computationId, {
        status: update.status,
        results: update.results,
      });

      // Remove from active set when completed
      if (update.status === 'completed' || update.status === 'failed') {
        setActiveComputationIds(prev => {
          const next = new Set(prev);
          next.delete(update.computationId);
          return next;
        });
      }
    },
    [onHistoryUpdate]
  );

  // Subscribe to SSE updates for ALL active computations
  useActiveComputationsSubscription(activeComputationIds, {
    enabled,
    onUpdate: handleActiveComputationUpdate,
  });

  // Combine tRPC data and SSE updates
  const currentComputation = useMemo(() => {
    if (sseUpdate && currentComputationId === sseUpdate.computationId) {
      // Use SSE data for active computations
      const historyItem = historyItems.find(h => h._id === sseUpdate.computationId);
      return {
        _id: sseUpdate.computationId,
        status: sseUpdate.status,
        results: sseUpdate.results,
        totalProgress: sseUpdate.totalProgress,
        fromCache: false,
        a: historyItem?.a ?? 0,
        b: historyItem?.b ?? 0,
        mode: historyItem?.mode ?? 'classic',
        userId: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Computation & { totalProgress: number; fromCache: boolean };
    }
    return trpcComputation ?? null;
  }, [sseUpdate, trpcComputation, currentComputationId, historyItems]);

  const trackActiveComputation = useCallback((computationId: string) => {
    setActiveComputationIds(prev => new Set(prev).add(computationId));
  }, []);

  const reset = useCallback(() => {
    setCurrentComputationId(null);
    setActiveComputationIds(new Set());
  }, []);

  return {
    currentComputationId,
    setCurrentComputationId,
    currentComputation,
    isLoadingCurrent,
    isCurrentComputationActive,
    trackActiveComputation,
    reset,
  };
}
