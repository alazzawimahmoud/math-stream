'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Computation } from '@mathstream/shared';

export interface ComputationUpdate {
  computationId: string;
  status: Computation['status'];
  results: Computation['results'];
  totalProgress: number;
}

export interface UseActiveComputationsSubscriptionOptions {
  enabled?: boolean;
  onUpdate?: (data: ComputationUpdate) => void;
}

/**
 * Subscribe to SSE updates for multiple active computations.
 * This ensures that when a user switches away from an in-progress computation,
 * it still receives updates and the list reflects the correct status.
 */
export function useActiveComputationsSubscription(
  activeIds: Set<string>,
  options: UseActiveComputationsSubscriptionOptions = {}
) {
  const { enabled = true, onUpdate } = options;
  const onUpdateRef = useRef(onUpdate);
  const eventSourcesRef = useRef<Map<string, EventSource>>(new Map());

  // Keep the callback ref updated
  onUpdateRef.current = onUpdate;

  const closeConnection = useCallback((computationId: string) => {
    const eventSource = eventSourcesRef.current.get(computationId);
    if (eventSource) {
      eventSource.close();
      eventSourcesRef.current.delete(computationId);
    }
  }, []);

  const openConnection = useCallback((computationId: string) => {
    // Don't open if already exists
    if (eventSourcesRef.current.has(computationId)) {
      return;
    }

    const url = `/api/subscribe/${computationId}`;
    const eventSource = new EventSource(url);
    eventSourcesRef.current.set(computationId, eventSource);

    eventSource.addEventListener('update', (event) => {
      try {
        const update = JSON.parse(event.data) as ComputationUpdate;
        onUpdateRef.current?.(update);

        // Close connection if completed
        if (update.status === 'completed' || update.status === 'failed') {
          closeConnection(computationId);
        }
      } catch (err) {
        console.error('Failed to parse SSE update:', err);
      }
    });

    eventSource.onerror = () => {
      closeConnection(computationId);
    };
  }, [closeConnection]);

  // Manage connections based on activeIds
  useEffect(() => {
    if (!enabled) {
      // Close all connections if disabled
      eventSourcesRef.current.forEach((_, id) => closeConnection(id));
      return;
    }

    // Open connections for new active IDs
    activeIds.forEach((id) => {
      if (!eventSourcesRef.current.has(id)) {
        openConnection(id);
      }
    });

    // Close connections for IDs no longer in the active set
    eventSourcesRef.current.forEach((_, id) => {
      if (!activeIds.has(id)) {
        closeConnection(id);
      }
    });
  }, [activeIds, enabled, openConnection, closeConnection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      eventSourcesRef.current.forEach((eventSource) => {
        eventSource.close();
      });
      eventSourcesRef.current.clear();
    };
  }, []);
}
