'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ComputationUpdate } from '@/types/computation';

export interface UseComputationSubscriptionOptions {
  enabled?: boolean;
  onUpdate?: (data: ComputationUpdate) => void;
}

export function useComputationSubscription(
  computationId: string | null,
  options: UseComputationSubscriptionOptions = {}
) {
  const { enabled = true, onUpdate } = options;
  const [data, setData] = useState<ComputationUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onUpdateRef = useRef(onUpdate);

  // Keep the callback ref updated
  onUpdateRef.current = onUpdate;

  const connect = useCallback(() => {
    if (!computationId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/subscribe/${computationId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.addEventListener('update', (event) => {
      try {
        const update = JSON.parse(event.data) as ComputationUpdate;
        setData(update);
        onUpdateRef.current?.(update);

        // Close connection if completed
        if (update.status === 'completed') {
          eventSource.close();
          setIsConnected(false);
        }
      } catch (err) {
        console.error('Failed to parse SSE update:', err);
      }
    });

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      
      // Only set error if we were expecting updates
      if (data?.status !== 'completed') {
        setError(new Error('Connection lost'));
      }
    };
  }, [computationId, enabled, data?.status]);

  // Connect when computationId changes
  useEffect(() => {
    if (!computationId || !enabled) {
      // Clean up if disabled or no ID
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setData(null);
      setIsConnected(false);
      return;
    }

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [computationId, enabled, connect]);

  // Reconnect on error after a delay
  useEffect(() => {
    if (error && enabled && computationId && data?.status !== 'completed') {
      const timeout = setTimeout(() => {
        connect();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [error, enabled, computationId, data?.status, connect]);

  return {
    data,
    isConnected,
    error,
    reconnect: connect,
  };
}
