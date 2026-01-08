'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/trpc/client';
import { useSession, signOut, signIn } from '@/lib/auth-client';
import { Calculator, Sparkles, Loader2, X, Brain, LogOut } from 'lucide-react';
import type { ComputationMode } from '@mathstream/shared';

interface ComputeFormProps {
  onComputationCreated: (id: string) => void;
  isProcessing?: boolean;
}

export function ComputeForm({ onComputationCreated, isProcessing }: ComputeFormProps) {
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  const [mode, setMode] = useState<ComputationMode>('classic');
  const prevIsProcessing = useRef(isProcessing);
  const { data: session, isPending: isSessionLoading } = useSession();

  const createMutation = trpc.computation.create.useMutation({
    onSuccess: (data) => {
      onComputationCreated(data.id);
    },
  });

  const isLoading = createMutation.isPending || isProcessing;
  const isSignedIn = !!session?.user;

  const handleSignOut = () => {
    signOut({ callbackURL: '/' });
  };

  const handleSignIn = () => {
    signIn.social({ provider: 'google', callbackURL: '/app' });
  };

  // Clear inputs when computation completes
  useEffect(() => {
    if (prevIsProcessing.current && !isProcessing) {
      setA('');
      setB('');
    }
    prevIsProcessing.current = isProcessing;
  }, [isProcessing]);

  const handleClear = () => {
    setA('');
    setB('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      handleSignIn();
      return;
    }
    
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    
    if (isNaN(numA) || isNaN(numB)) {
      return;
    }

    createMutation.mutate({ a: numA, b: numB, mode });
  };

  return (
    <Card className="bg-card border-border shadow-sm overflow-hidden border-t-4 border-t-primary">
      <CardHeader className="bg-muted border-b border-border/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          {/* Top Row: MathStream + User Info on mobile, side by side on desktop */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-4 sm:gap-6">
            {/* MathStream Branding */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1 sm:p-1.5 bg-primary rounded-lg shadow-sm">
                <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-foreground" />
              </div>
              <span className="text-sm sm:text-lg font-bold text-primary">
                MathStream
              </span>
            </div>
            
            {/* User Info or Sign In - visible on mobile at top */}
            {isSessionLoading ? (
              <div className="flex items-center gap-2 sm:hidden">
                <div className="h-7 w-7 rounded-full bg-muted border border-border animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
            ) : session?.user ? (
              <div className="flex items-center gap-2 sm:hidden">
                <Avatar className="h-7 w-7 border border-border">
                  <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors p-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSignIn}
                size="sm"
                className="sm:hidden bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] px-4 py-2"
              >
                Sign In
              </Button>
            )}
          </div>
          
          {/* User Info or Sign In - desktop only */}
          {isSessionLoading ? (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted border border-border animate-pulse" />
                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          ) : session?.user ? (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium text-xs">
                  {session.user.name}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="h-4 w-4" />
                  <span className="ml-2 font-bold uppercase tracking-widest text-[9px]">Sign out</span>
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              size="sm"
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] px-6 py-2"
            >
              Sign In
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-border/40">
          <div className="p-0.5 bg-secondary/20 rounded">
            <Calculator className="h-2.5 w-2.5 text-secondary" />
          </div>
          <p className="text-foreground/80 text-[10px] font-black uppercase tracking-wider">Enter two numbers to compute</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={a}
                onChange={(e) => setA(e.target.value)}
                disabled={isLoading || !isSignedIn}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-9 text-lg font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Number B</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={b}
                onChange={(e) => setB(e.target.value)}
                disabled={isLoading || !isSignedIn}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-9 text-lg font-mono"
                required
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className={`flex flex-col gap-3 p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/50 transition-all ${isLoading || !isSignedIn ? 'opacity-50 grayscale' : ''}`}>
            {/* Stacked on mobile, horizontal on larger screens */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Classic Mode Option */}
              <button
                type="button"
                onClick={() => setMode('classic')}
                disabled={isLoading || !isSignedIn}
                className={`flex items-center gap-2 p-2.5 rounded-lg transition-all md:flex-1 ${
                  mode === 'classic' 
                    ? 'bg-secondary/20 border-2 border-secondary' 
                    : 'bg-muted/30 border-2 border-transparent hover:border-border'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  mode === 'classic' ? 'bg-secondary shadow-lg shadow-secondary/20' : 'bg-muted border border-border'
                }`}>
                  <Calculator className={`h-3.5 w-3.5 ${
                    mode === 'classic' ? 'text-secondary-foreground' : 'text-foreground/30'
                  }`} />
                </div>
                <div className="flex flex-col flex-1 text-left">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    mode === 'classic' ? 'text-foreground' : 'text-foreground/30'
                  }`}>
                    Classic
                  </span>
                  <div className="flex items-center gap-1 opacity-40 mt-0.5">
                    <Brain className="h-2 w-2 text-foreground" />
                    <span className="text-[7px] text-foreground font-black uppercase tracking-widest">
                      Human Brain
                    </span>
                  </div>
                </div>
                {mode === 'classic' && (
                  <div className="h-4 w-4 rounded-full bg-secondary border-2 border-secondary-foreground" />
                )}
              </button>

              {/* AI Mode Option */}
              <button
                type="button"
                onClick={() => setMode('ai')}
                disabled={isLoading || !isSignedIn}
                className={`flex items-center gap-2 p-2.5 rounded-lg transition-all md:flex-1 ${
                  mode === 'ai' 
                    ? 'bg-accent/20 border-2 border-accent' 
                    : 'bg-muted/30 border-2 border-transparent hover:border-border'
                }`}
              >
                <div className={`p-2 rounded-lg transition-all duration-300 ${
                  mode === 'ai' ? 'bg-accent shadow-lg shadow-accent/20' : 'bg-muted border border-border'
                }`}>
                  <Sparkles className={`h-3.5 w-3.5 ${
                    mode === 'ai' ? 'text-accent-foreground' : 'text-foreground/30'
                  }`} />
                </div>
                <div className="flex flex-col flex-1 text-left">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    mode === 'ai' ? 'text-foreground' : 'text-foreground/30'
                  }`}>
                    AI Mode
                  </span>
                  <div className="flex items-center gap-1 opacity-40 mt-0.5">
                    <span className="text-[7px] text-accent font-black uppercase tracking-widest">
                      Google Gemini
                    </span>
                    <Sparkles className="h-2 w-2 text-accent" />
                  </div>
                </div>
                {mode === 'ai' && (
                  <div className="h-4 w-4 rounded-full bg-accent border-2 border-accent-foreground" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Button
              type="submit"
              disabled={isLoading || !a || !b || !isSignedIn}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase tracking-[0.2em] h-10 shadow-xl shadow-secondary/10 transition-all active:scale-[0.98] rounded-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing
                </>
              ) : !isSignedIn ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign In to Run
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Run Computation
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading || (!a && !b) || !isSignedIn}
              className="border-border text-foreground/60 hover:bg-muted hover:text-foreground px-8 font-black uppercase tracking-widest text-[9px] h-10 transition-all rounded-lg"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Clear
            </Button>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-destructive text-[10px] font-black uppercase tracking-widest text-center">{createMutation.error.message}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
