'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { trpc } from '@/trpc/client';
import { useSession, signOut } from '@/lib/auth-client';
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
  const { data: session } = useSession();

  const createMutation = trpc.computation.create.useMutation({
    onSuccess: (data) => {
      onComputationCreated(data.id);
    },
  });

  const isLoading = createMutation.isPending || isProcessing;

  const handleSignOut = () => {
    signOut({ callbackURL: '/' });
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
              <div className="p-1.5 sm:p-2 bg-primary rounded-xl shadow-sm">
                <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <span className="text-base sm:text-xl font-bold text-primary">
                MathStream
              </span>
            </div>
            
            {/* User Info - visible on mobile at top */}
            {session?.user && (
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
            )}
          </div>
          
          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-8 w-px bg-border/50" />
          
          {/* Computation Section */}
          <div className="space-y-1 flex-1 sm:flex-none">
            <CardTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg font-black uppercase tracking-widest">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
              New Computation
            </CardTitle>
            <CardDescription className="text-foreground/60 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider">
              Enter two numbers for parallel processing
            </CardDescription>
          </div>
          
          {/* User Info - desktop only */}
          {session?.user && (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground font-medium text-sm">
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
                <span className="ml-2 font-bold uppercase tracking-widest text-[10px]">Sign out</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="0.00"
                value={a}
                onChange={(e) => setA(e.target.value)}
                disabled={isLoading}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-12 text-xl font-mono"
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
                disabled={isLoading}
                className="bg-muted/30 border-border text-foreground placeholder:text-foreground/20 focus-visible:ring-secondary h-12 text-xl font-mono"
                required
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className={`flex flex-col gap-3 p-5 bg-muted/50 rounded-xl border border-border/50 transition-all ${isLoading ? 'opacity-50 grayscale' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  mode === 'classic' ? 'bg-secondary shadow-lg shadow-secondary/20 scale-110' : 'bg-muted border border-border'
                }`}>
                  <Calculator className={`h-4 w-4 ${
                    mode === 'classic' ? 'text-secondary-foreground' : 'text-foreground/30'
                  }`} />
                </div>
                <div className="flex flex-col">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    mode === 'classic' ? 'text-foreground' : 'text-foreground/30'
                  }`}>
                    Classic
                  </span>
                  <div className="flex items-center gap-1.5 opacity-40 mt-1">
                    <Brain className="h-2.5 w-2.5 text-foreground" />
                    <span className="text-[8px] text-foreground font-black uppercase tracking-widest">
                      Human Brain
                    </span>
                  </div>
                </div>
              </div>
              
              <Switch
                checked={mode === 'ai'}
                onCheckedChange={(checked) => setMode(checked ? 'ai' : 'classic')}
                disabled={isLoading}
                className="data-[state=checked]:bg-accent data-[state=unchecked]:bg-secondary"
              />
              
              <div className="flex items-center gap-4 text-right">
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-black uppercase tracking-widest ${
                    mode === 'ai' ? 'text-foreground' : 'text-foreground/30'
                  }`}>
                    AI Mode
                  </span>
                  <div className="flex items-center gap-1.5 opacity-40 mt-1">
                    <span className="text-[8px] text-accent font-black uppercase tracking-widest">
                      Google Gemini
                    </span>
                    <Sparkles className="h-2.5 w-2.5 text-accent" />
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                  mode === 'ai' ? 'bg-accent shadow-lg shadow-accent/20 scale-110' : 'bg-muted border border-border'
                }`}>
                  <Sparkles className={`h-4 w-4 ${
                    mode === 'ai' ? 'text-accent-foreground' : 'text-foreground/30'
                  }`} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              type="submit"
              disabled={isLoading || !a || !b}
              className="flex-1 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-black uppercase tracking-[0.2em] h-14 shadow-xl shadow-secondary/10 transition-all active:scale-[0.98] rounded-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-3" />
                  Run Computation
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isLoading || (!a && !b)}
              className="border-border text-foreground/60 hover:bg-muted hover:text-foreground px-10 font-black uppercase tracking-widest text-[10px] h-14 transition-all rounded-xl"
            >
              <X className="h-4 w-4 mr-2" />
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
