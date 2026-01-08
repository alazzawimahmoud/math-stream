import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import type { NextRequest } from 'next/server';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

// Wrap handlers to defer evaluation until runtime
export async function GET(request: NextRequest) {
  const { GET: handler } = toNextJsHandler(auth.handler);
  return handler(request);
}

export async function POST(request: NextRequest) {
  const { POST: handler } = toNextJsHandler(auth.handler);
  return handler(request);
}

