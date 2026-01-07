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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl font-black uppercase tracking-[0.2em]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 sm:py-32">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="p-4 bg-secondary rounded-[2rem] shadow-xl shadow-secondary/20 rotate-3 hover:rotate-0 transition-transform duration-500">
              <Calculator className="h-12 w-12 text-secondary-foreground" />
            </div>
            <h1 className="text-6xl font-black text-foreground tracking-tighter">
              Math<span className="text-secondary">Stream</span>
            </h1>
          </div>
          <p className="text-xl text-foreground/80 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            A high-performance, queue-based computation engine. Watch your complex mathematical operations 
            process in real-time with our advanced worker system.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              onClick={handleGoogleSignIn}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
            <div className="flex items-center gap-2 text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em] px-4">
              <span className="w-8 h-[1px] bg-border"></span>
              Secure Auth
              <span className="w-8 h-[1px] bg-border"></span>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="bg-card/50 border-border/50 hover:border-secondary/20 transition-colors group shadow-sm hover:shadow-xl hover:shadow-secondary/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <div className="p-4 bg-muted rounded-2xl w-fit mb-6 group-hover:bg-secondary/10 transition-colors">
                <Zap className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-foreground text-xl font-black uppercase tracking-wider mb-2">Queue Processing</CardTitle>
              <CardDescription className="text-foreground/60 font-medium leading-relaxed">
                Jobs run in parallel with real-time progress updates. Watch all four operations 
                process simultaneously with zero lag.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 border-border/50 hover:border-accent/20 transition-colors group shadow-sm hover:shadow-xl hover:shadow-accent/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <div className="p-4 bg-muted rounded-2xl w-fit mb-6 group-hover:bg-accent/10 transition-colors">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-foreground text-xl font-black uppercase tracking-wider mb-2">AI-Powered Math</CardTitle>
              <CardDescription className="text-foreground/60 font-medium leading-relaxed">
                Choose between traditional mathematical calculations or advanced AI-powered 
                computations using Google Gemini models.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 border-border/50 hover:border-destructive/20 transition-colors group shadow-sm hover:shadow-xl hover:shadow-destructive/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="p-8">
              <div className="p-4 bg-muted rounded-2xl w-fit mb-6 group-hover:bg-destructive/10 transition-colors">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-foreground text-xl font-black uppercase tracking-wider mb-2">Smart Caching</CardTitle>
              <CardDescription className="text-foreground/60 font-medium leading-relaxed">
                Completed computations are cached in high-speed Redis for instant retrieval 
                on subsequent identical requests.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Tech Stack */}
        <div className="mt-32 text-center">
          <p className="text-foreground/30 text-[10px] font-black mb-8 uppercase tracking-[0.4em]">Engineered with</p>
          <div className="flex flex-wrap justify-center gap-4 text-foreground/60">
            {['Next.js 14', 'tRPC', 'BullMQ', 'MongoDB', 'Redis', 'Gemini AI'].map(tech => (
              <span key={tech} className="px-5 py-2 bg-muted border border-border/50 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-primary/30 transition-colors">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
