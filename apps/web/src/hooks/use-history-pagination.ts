'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/trpc/client';
import type { Computation } from '@mathstream/shared';

const HISTORY_LIMIT = 20;
const REFETCH_INTERVAL = 10000; // 10 seconds

interface UseHistoryPaginationOptions {
  enabled: boolean;
}

export function useHistoryPagination({ enabled }: UseHistoryPaginationOptions) {
  const [historyItems, setHistoryItems] = useState<Computation[]>([]);
  const [historySkip, setHistorySkip] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalHistory, setTotalHistory] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Track optimistically added items separately (using ref to avoid triggering effects)
  const optimisticIdsRef = useRef<Set<string>>(new Set());

  // Fetch history
  const { data: historyData, isLoading: isLoadingHistory } = trpc.computation.getHistory.useQuery(
    { limit: HISTORY_LIMIT, skip: 0 },
    {
      enabled,
      refetchInterval: enabled ? REFETCH_INTERVAL : false,
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

  // Load more query (disabled by default)
  const loadMoreQuery = trpc.computation.getHistory.useQuery(
    { limit: HISTORY_LIMIT, skip: historySkip },
    { enabled: false }
  );

  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    const result = await loadMoreQuery.refetch();
    if (result.data) {
      setHistoryItems(prev => [...prev, ...result.data.computations]);
      setHasMoreHistory(result.data.hasMore);
      setHistorySkip(prev => prev + result.data.computations.length);
    }
    setIsLoadingMore(false);
  }, [loadMoreQuery]);

  const addOptimisticItem = useCallback((computation: Computation) => {
    setHistoryItems(prev => [computation, ...prev]);
    setTotalHistory(prev => prev + 1);
    optimisticIdsRef.current.add(computation._id);
  }, []);

  const updateItem = useCallback((computationId: string, updates: Partial<Computation>) => {
    setHistoryItems(prev =>
      prev.map(item =>
        item._id === computationId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const reset = useCallback(() => {
    setHistoryItems([]);
    setHistorySkip(0);
    setHasMoreHistory(false);
    setTotalHistory(0);
    optimisticIdsRef.current = new Set();
  }, []);

  return {
    historyItems,
    isLoadingHistory,
    isLoadingMore,
    hasMoreHistory,
    totalHistory,
    handleLoadMore,
    addOptimisticItem,
    updateItem,
    reset,
  };
}
