'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/trpc/client';
import { useSession, signOut, signIn } from '@/lib/auth-client';
import { Calculator, Sparkles, Loader2, LogOut } from 'lucide-react';
import { CalculatorIcon } from '@/components/icons/calculator';
import { GoogleIcon } from '@/components/icons/google';
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
    <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-primary w-full">
      <CardHeader className="bg-muted border-b border-border/50 h-[56px] py-1.5 px-3">
        <div className="flex items-center justify-between w-full h-full">
          {/* Top Row: MathStream + User Info on mobile, side by side on desktop */}
          <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-4 sm:gap-6">
            {/* MathStream Branding */}
            <div className="flex items-center gap-2 sm:gap-3">
              <CalculatorIcon size="sm" />
              <span className="text-sm sm:text-lg font-bold text-primary">
                MathStream
              </span>
            </div>
            
            {/* User Info or Sign In - visible on mobile at top */}
            {isSessionLoading ? null : session?.user ? (
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
                className="sm:hidden bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase  text-[10px] px-4 py-2"
              >
                <GoogleIcon className="h-3.5 w-3.5 mr-1.5" />
                Sign In
              </Button>
            )}
          </div>
          
          {/* User Info or Sign In - desktop only */}
          {isSessionLoading ? null : session?.user ? (
            <div className="hidden sm:flex items-center gap-4">
              <div className="relative group flex items-center">
                <span className="absolute right-full mr-2 px-2 py-1 bg-card border border-border rounded text-foreground font-medium text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
                  {session.user.name?.split(' ')[0] ?? 'User'}
                </span>
                <Avatar className="h-8 w-8 border border-border cursor-pointer">
                  <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors h-8 w-8"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSignIn}
              size="sm"
              className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase  text-[10px] px-6 py-2"
            >
              <GoogleIcon className="h-3.5 w-3.5 mr-1.5" />
              Sign In
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-3 pb-3">
        <div className="mb-2 pb-1.5 border-b border-border/40">
          <p className="text-foreground/80 text-[10px] font-black uppercase">Enter two numbers to compute</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Inputs row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase  text-foreground/40">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={a}
                onChange={(e) => setA(e.target.value)}
                disabled={isLoading || !isSignedIn}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-8 text-base font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase  text-foreground/40">Number B</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={b}
                onChange={(e) => setB(e.target.value)}
                disabled={isLoading || !isSignedIn}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-8 text-base font-mono"
                required
              />
            </div>
          </div>
          
          {/* Actions row */}
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              disabled={isLoading || !a || !b || !isSignedIn}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase h-8 text-[9px] shadow-lg shadow-secondary/10 transition-all active:scale-[0.98] rounded-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Processing
                </>
              ) : !isSignedIn ? (
                <>
                  <GoogleIcon className="h-3 w-3 mr-1" />
                  Sign In
                </>
              ) : (
                'Run'
              )}
            </Button>
            {/* AI/Classic Toggle */}
            <div className={`grid grid-cols-2 h-8 rounded-lg bg-muted p-0.5 gap-0.5 border border-border ${isLoading || !isSignedIn ? 'opacity-50' : ''}`}>
              <button
                type="button"
                onClick={() => setMode('classic')}
                disabled={isLoading || !isSignedIn}
                className={`flex items-center justify-center gap-1 px-2.5 rounded-md text-[9px] font-black uppercase  transition-all ${
                  mode === 'classic'
                    ? 'bg-foreground/10 text-foreground shadow-sm'
                    : 'text-foreground/30 hover:text-foreground/50'
                }`}
              >
                <Calculator className="h-3 w-3" />
                <span className="hidden sm:inline">Classic</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                disabled={isLoading || !isSignedIn}
                className={`flex items-center justify-center gap-1 px-2.5 rounded-md text-[9px] font-black uppercase  transition-all ${
                  mode === 'ai'
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'text-foreground/30 hover:text-foreground/50'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">AI</span>
              </button>
            </div>
          </div>

          {createMutation.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
              <p className="text-destructive text-[10px] font-black uppercase  text-center">{createMutation.error.message}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
