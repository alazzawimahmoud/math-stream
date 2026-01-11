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
    <Card className="overflow-hidden w-full">
      <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40 dark:from-muted/60 dark:to-muted/30 border-b border-border/50 h-[52px] py-2.5 px-3">
        <div className="flex items-center justify-between w-full h-full">
          <div className="flex items-center gap-2.5">
            <Image 
              src="/logo.png" 
              alt="MathStream" 
              width={108}
              height={108}
              quality={95}
              className="h-8 w-8"
              priority
            />
            <span className="text-base font-semibold text-foreground tracking-tight">
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
      <CardContent className="py-3 px-3">
        <form onSubmit={handleSubmit} className="space-y-2.5">
          {/* Mode Toggle - Compact pill */}
          <div className="flex justify-center">
            <div className={`inline-flex items-center p-0.5 rounded-full bg-muted neu-pressed-sm ${isSubmitting || !isSignedIn ? 'opacity-50' : ''}`}>
              <button
                type="button"
                onClick={() => setMode('classic')}
                disabled={isSubmitting || !isSignedIn}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  mode === 'classic'
                    ? 'gradient-blue text-secondary-foreground neu-raised-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calculator className="h-3 w-3" />
                <span>Classic</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                disabled={isSubmitting || !isSignedIn}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  mode === 'ai'
                    ? 'gradient-purple text-accent-foreground neu-raised-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>AI Mode</span>
              </button>
            </div>
          </div>
          
          {/* Inputs row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground ml-1">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={a}
                onChange={(e) => setA(e.target.value)}
                disabled={isSubmitting || !isSignedIn}
                className="text-sm font-mono h-9"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-medium text-muted-foreground ml-1">Number B</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={b}
                onChange={(e) => setB(e.target.value)}
                disabled={isSubmitting || !isSignedIn}
                className="text-sm font-mono h-9"
                required
              />
            </div>
          </div>
          
          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || !a || !b || !isSignedIn}
            variant={mode === 'ai' ? 'pill-accent' : 'pill'}
            size="pill-sm"
            className="w-full text-xs font-semibold h-9"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Computing...
              </>
            ) : !isSignedIn ? (
              <>
                <GoogleIcon className="h-3.5 w-3.5 mr-1.5" />
                Sign in to Compute
              </>
            ) : (
              <>
                {mode === 'ai' ? <Sparkles className="h-3.5 w-3.5 mr-1.5" /> : <Calculator className="h-3.5 w-3.5 mr-1.5" />}
                Compute
              </>
            )}
          </Button>

          {createMutation.error && (
            <div className="p-2 bg-destructive/10 rounded-xl neu-pressed-sm">
              <p className="text-destructive text-xs font-medium text-center">{createMutation.error.message}</p>
            </div>
          )}
        </form>
      </CardContent>
      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Card>
  );
}
