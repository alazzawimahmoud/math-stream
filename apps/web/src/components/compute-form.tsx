'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/trpc/client';
import { Calculator, Sparkles, Loader2 } from 'lucide-react';
import type { ComputationMode } from '@mathstream/shared';

interface ComputeFormProps {
  onComputationCreated: (id: string) => void;
}

export function ComputeForm({ onComputationCreated }: ComputeFormProps) {
  const [a, setA] = useState<string>('');
  const [b, setB] = useState<string>('');
  const [mode, setMode] = useState<ComputationMode>('classic');

  const createMutation = trpc.computation.create.useMutation({
    onSuccess: (data) => {
      onComputationCreated(data.id);
      setA('');
      setB('');
    },
  });

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
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Calculator className="h-5 w-5 text-violet-400" />
          New Computation
        </CardTitle>
        <CardDescription className="text-slate-400">
          Enter two numbers to compute all four operations (add, subtract, multiply, divide)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Number A</label>
              <Input
                type="number"
                step="any"
                placeholder="Enter number A"
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Number B</label>
              <Input
                type="number"
                step="any"
                placeholder="Enter number B"
                value={b}
                onChange={(e) => setB(e.target.value)}
                className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors ${
                mode === 'classic' ? 'bg-violet-500/20' : 'bg-slate-700/50'
              }`}>
                <Calculator className={`h-4 w-4 ${
                  mode === 'classic' ? 'text-violet-400' : 'text-slate-500'
                }`} />
              </div>
              <span className={`text-sm font-medium ${
                mode === 'classic' ? 'text-white' : 'text-slate-500'
              }`}>
                Classic
              </span>
            </div>
            
            <Switch
              checked={mode === 'ai'}
              onCheckedChange={(checked) => setMode(checked ? 'ai' : 'classic')}
              className="data-[state=checked]:bg-purple-500"
            />
            
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${
                mode === 'ai' ? 'text-white' : 'text-slate-500'
              }`}>
                AI
              </span>
              <div className={`p-2 rounded-lg transition-colors ${
                mode === 'ai' ? 'bg-purple-500/20' : 'bg-slate-700/50'
              }`}>
                <Sparkles className={`h-4 w-4 ${
                  mode === 'ai' ? 'text-purple-400' : 'text-slate-500'
                }`} />
              </div>
            </div>
          </div>

          {mode === 'ai' && (
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by Google Gemini
            </Badge>
          )}

          <Button
            type="submit"
            disabled={createMutation.isPending || !a || !b}
            className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4 mr-2" />
                Compute
              </>
            )}
          </Button>

          {createMutation.error && (
            <p className="text-red-400 text-sm">{createMutation.error.message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

