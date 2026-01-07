'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession, signIn } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Calculator, Sparkles, Zap, Shield } from 'lucide-react';

export default function LandingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/app');
    }
  }, [session, router]);

  const handleGoogleSignIn = () => {
    signIn.social({ provider: 'google', callbackURL: '/app' });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl">
              <Calculator className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-purple-200 to-violet-300 bg-clip-text text-transparent">
              MathStream
            </h1>
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            A modern queue-based computation engine. Submit calculations and watch them process in real-time 
            with classic math or AI-powered computations.
          </p>
          <Button 
            onClick={handleGoogleSignIn}
            size="lg"
            className="bg-white text-slate-900 hover:bg-slate-100 font-semibold px-8 py-6 text-lg rounded-xl shadow-2xl shadow-purple-500/20"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="p-2 bg-violet-500/20 rounded-lg w-fit mb-2">
                <Zap className="h-6 w-6 text-violet-400" />
              </div>
              <CardTitle className="text-white">Queue-Based Processing</CardTitle>
              <CardDescription className="text-slate-400">
                Jobs run in parallel with real-time progress updates. Watch all four operations 
                process simultaneously.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="p-2 bg-purple-500/20 rounded-lg w-fit mb-2">
                <Sparkles className="h-6 w-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">Classic or AI Mode</CardTitle>
              <CardDescription className="text-slate-400">
                Choose between traditional mathematical calculations or AI-powered 
                computations using Google Gemini.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <div className="p-2 bg-pink-500/20 rounded-lg w-fit mb-2">
                <Shield className="h-6 w-6 text-pink-400" />
              </div>
              <CardTitle className="text-white">Smart Caching</CardTitle>
              <CardDescription className="text-slate-400">
                Completed computations are cached in Redis for instant retrieval 
                on subsequent requests.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <p className="text-slate-500 text-sm mb-4">Built with</p>
          <div className="flex flex-wrap justify-center gap-4 text-slate-400 text-sm">
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">Next.js 14</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">tRPC</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">BullMQ</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">MongoDB</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">Redis</span>
            <span className="px-3 py-1 bg-slate-800/50 rounded-full">Gemini AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
