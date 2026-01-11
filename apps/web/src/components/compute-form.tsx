'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { trpc } from '@/trpc/client';
import { useSession, signIn } from '@/lib/auth-client';
import { Calculator, Sparkles, Loader2 } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/google';
import { UserSettingsDialog } from '@/components/user-settings-dialog';
import { UserControls } from '@/components/user-controls';
import Image from 'next/image';
import type { ComputationMode } from '@mathstream/shared';

interface ComputeFormProps {
  onComputationCreated: (computation: import('@mathstream/shared').Computation) => void;
}

export function ComputeForm({ onComputationCreated }: ComputeFormProps) {
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  const [mode, setMode] = useState<ComputationMode>('classic');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: session, isPending: isSessionLoading } = useSession();

  const createMutation = trpc.computation.create.useMutation({
    onSuccess: (data) => {
      onComputationCreated(data);
      // Clear inputs after successful submission
      setA('');
      setB('');
    },
  });

  const isSubmitting = createMutation.isPending;
  const isSignedIn = !!session?.user;

  const handleSignIn = useCallback(() => {
    signIn.social({ provider: 'google', callbackURL: '/' });
  }, []);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

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
    <Card className="bg-card border-0 shadow-xl shadow-black/15 overflow-hidden w-full">
      <CardHeader className="bg-muted border-b border-border/50 h-[44px] sm:h-[72px] py-1 sm:py-1.5 px-2 sm:px-3">
        <div className="flex items-center justify-between w-full h-full">
          {/* MathStream Branding */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Image 
              src="/logo.png" 
              alt="MathStream" 
              width={108}
              height={108}
              quality={95}
              className="h-10 w-10 sm:h-11 sm:w-11"
              priority
            />
            <span className="text-xs sm:text-lg font-bold text-primary">
              MathStream
            </span>
          </div>
          
          {!isSessionLoading && (
            <UserControls
              user={session?.user ?? null}
              onSignIn={handleSignIn}
              onOpenSettings={handleOpenSettings}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-2 sm:pt-3 sm:pb-3 px-2 sm:px-6">
        <div className="mb-1.5 sm:mb-2 pb-1 sm:pb-1.5 border-b border-border/40">
          <p className="text-foreground/80 text-[9px] sm:text-[10px] font-black uppercase">Enter two numbers to compute</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-1.5 sm:space-y-2.5">
          {/* Inputs row */}
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <div className="space-y-0.5 sm:space-y-1">
              <label className="text-[8px] sm:text-[9px] font-black uppercase text-foreground/40">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={a}
                onChange={(e) => setA(e.target.value)}
                disabled={isSubmitting || !isSignedIn}
                className="bg-muted border-border text-foreground placeholder:text-foreground/50 focus-visible:ring-secondary h-7 sm:h-8 text-sm sm:text-base font-mono"
                required
              />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <label className="text-[8px] sm:text-[9px] font-black uppercase text-foreground/40">Number B</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={b}
                onChange={(e) => setB(e.target.value)}
                disabled={isSubmitting || !isSignedIn}
                className="bg-muted border-border text-foreground placeholder:text-foreground/50 focus-visible:ring-secondary h-7 sm:h-8 text-sm sm:text-base font-mono"
                required
              />
            </div>
          </div>
          
          {/* Actions row */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !a || !b || !isSignedIn}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-black uppercase h-7 sm:h-8 text-[8px] sm:text-[9px] shadow-lg shadow-foreground/20 transition-all active:scale-[0.98] rounded-md"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Submitting...
                </>
              ) : !isSignedIn ? (
                <>
                  <GoogleIcon className="h-3 w-3 mr-1" />
                  Sign In
                </>
              ) : (
                'Submit'
              )}
            </Button>
            {/* AI/Classic Toggle */}
            <div className={`grid grid-cols-2 h-7 sm:h-8 rounded-md sm:rounded-lg bg-muted p-0.5 gap-0.5 border border-border ${isSubmitting || !isSignedIn ? 'opacity-50' : ''}`}>
              <button
                type="button"
                onClick={() => setMode('classic')}
                disabled={isSubmitting || !isSignedIn}
                className={`flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase transition-all ${
                  mode === 'classic'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-foreground/50 hover:text-foreground/70'
                }`}
              >
                <Calculator className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span className="hidden sm:inline">Classic</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                disabled={isSubmitting || !isSignedIn}
                className={`flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 rounded-md text-[8px] sm:text-[9px] font-black uppercase transition-all ${
                  mode === 'ai'
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-foreground/50 hover:text-foreground/70'
                }`}
              >
                <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
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
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Card>
  );
}
