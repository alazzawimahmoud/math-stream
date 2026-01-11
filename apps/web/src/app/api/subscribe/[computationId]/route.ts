import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getComputation, connectDb } from '@mathstream/db';
import { subscribeToComputation, type ComputationUpdate } from '@mathstream/cache';
import { calculateTotalProgress, type Computation } from '@mathstream/shared';

export const dynamic = 'force-dynamic';

// Initialize database connection
let dbConnected = false;
async function ensureDbConnection() {
  if (!dbConnected) {
    await connectDb();
    dbConnected = true;
  }
}

// SSE response headers
const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
} as const;

// Encode SSE event
const encoder = new TextEncoder();
function encodeSSEEvent(data: ComputationUpdate): string {
  return `event: update\ndata: ${JSON.stringify(data)}\n\n`;
}

// Build ComputationUpdate from computation state
function buildUpdate(
  computationId: string,
  status: Computation['status'],
  results: Computation['results']
): ComputationUpdate {
  const totalProgress = calculateTotalProgress(results);
  return { computationId, status, results, totalProgress };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ computationId: string }> }
) {
  const { computationId } = await params;

  // Authenticate the user
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  await ensureDbConnection();

  // Verify the computation belongs to the user
  const computation = await getComputation(computationId);
  if (!computation) {
    return new Response('Computation not found', { status: 404 });
  }

  if (computation.userId !== session.user.id) {
    return new Response('Forbidden', { status: 403 });
  }

  // If computation is already completed, send a single event and close
  if (computation.status === 'completed') {
    const data = buildUpdate(computationId, computation.status, computation.results);
    return new Response(encodeSSEEvent(data), { headers: SSE_HEADERS });
  }

  // Set up SSE stream
  let isConnectionClosed = false;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial state
      const initialData = buildUpdate(computationId, computation.status, computation.results);
      controller.enqueue(encoder.encode(encodeSSEEvent(initialData)));

      // Subscribe to Redis updates
      const { unsubscribe, subscriber } = subscribeToComputation(
        computationId,
        (data: ComputationUpdate) => {
          if (isConnectionClosed) return;
          
          try {
            controller.enqueue(encoder.encode(encodeSSEEvent(data)));
            
            // Close the stream if computation is completed
            if (data.status === 'completed') {
              isConnectionClosed = true;
              unsubscribe().catch(console.error);
              controller.close();
            }
          } catch {
            // Stream was closed
            isConnectionClosed = true;
            unsubscribe().catch(console.error);
          }
        }
      );

      // Handle client disconnect
      subscriber.on('error', () => {
        if (!isConnectionClosed) {
          isConnectionClosed = true;
          unsubscribe().catch(console.error);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      });
    },
    cancel() {
      isConnectionClosed = true;
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
