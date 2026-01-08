'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, XCircle, Loader2, Clock, Sparkles, Database } from 'lucide-react';
import type { Computation } from '@mathstream/shared';

interface ResultsTableProps {
  computation: Computation & { totalProgress: number; fromCache: boolean };
}

const operationLabels: Record<string, string> = {
  add: 'A + B',
  subtract: 'A - B',
  multiply: 'A × B',
  divide: 'A ÷ B',
};

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-foreground/40',
    bgColor: 'bg-muted',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'Failed',
  },
};

export function ResultsTable({ computation }: ResultsTableProps) {
  return (
    <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary">
      <CardHeader className="bg-muted border-b border-border/50 h-[70px] py-2 px-4">
        <div className="flex items-center justify-between w-full h-full">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-foreground text-base font-black uppercase tracking-widest">
                Computation Engine
              </CardTitle>
              {/* Icons only for mobile */}
              <div className="flex items-center gap-2 sm:hidden">
                {computation.mode === 'ai' && (
                  <Sparkles className="h-5 w-5 text-accent" />
                )}
                {computation.fromCache && (
                  <Database className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>
            <div className="text-[9px] text-foreground/40 font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary"></span> A: {computation.a}</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent"></span> B: {computation.b}</span>
            </div>
          </div>
          {/* Badges with labels for desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {computation.mode === 'ai' && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground border-transparent font-black uppercase tracking-widest text-[8px] px-2 py-1 shadow-lg shadow-accent/10">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                AI Enhanced
              </Badge>
            )}
            {computation.fromCache && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground border-transparent font-black uppercase tracking-widest text-[8px] px-2 py-1 shadow-lg shadow-primary/10">
                <Database className="h-2.5 w-2.5 mr-1" />
                Buffered
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        {/* Total Progress */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-muted/50 rounded-xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40">Total Execution Payload</span>
            <span className="text-sm font-black text-secondary font-mono tracking-tighter">{computation.totalProgress}%</span>
          </div>
          <Progress 
            value={computation.totalProgress} 
            className="h-3 bg-muted border border-border shadow-inner"
          />
        </div>

        {/* Results Table */}
        <div className="rounded-2xl border border-border/50 overflow-hidden shadow-inner bg-muted/20 overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow className="bg-muted border-border/50 hover:bg-muted transition-none">
                <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 py-2 px-2 sm:px-4">Operation</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 py-2 px-2 sm:px-4">Pipeline</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 py-2 px-2 sm:px-4">Computed Value</TableHead>
                <TableHead className="text-[9px] font-black uppercase tracking-[0.2em] text-foreground/40 text-right py-2 px-2 sm:px-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computation.results.map((result) => {
                const status = statusConfig[result.status];
                const StatusIcon = status.icon;
                const isAnimating = result.status === 'processing';
                
                return (
                  <TableRow key={result.operation} className="border-border/50 hover:bg-card transition-all group">
                    <TableCell className="text-foreground font-black uppercase tracking-wider text-xs py-2.5 sm:py-3.5 px-2 sm:px-4">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-1 h-4 bg-border group-hover:bg-secondary transition-colors rounded-full"></div>
                        {operationLabels[result.operation]}
                      </div>
                    </TableCell>
                    <TableCell className="w-[220px] py-2.5 sm:py-3.5 px-2 sm:px-4">
                      <div className="flex items-center gap-1.5 sm:gap-3">
                        <Progress 
                          value={result.progress} 
                          className="h-1.5 flex-1 bg-muted border border-border/50"
                        />
                        <span className="text-[9px] font-black text-foreground/30 w-9 text-right font-mono tracking-tighter">
                          {result.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono font-black text-sm sm:text-base py-2.5 sm:py-3.5 px-2 sm:px-4">
                      {result.status === 'completed' && result.result !== null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-secondary tabular-nums">{result.result}</span>
                          <CheckCircle2 className="h-4 w-4 text-secondary/30" />
                        </div>
                      ) : result.status === 'failed' && result.error ? (
                        <span className="text-destructive text-[10px] font-black uppercase tracking-tight leading-none bg-destructive/5 px-2 py-1 rounded border border-destructive/10">{result.error}</span>
                      ) : (
                        <div className="flex items-center gap-1.5 opacity-10">
                           <span className="w-8 h-1 bg-foreground rounded-full"></span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right py-2.5 sm:py-3.5 px-2 sm:px-4">
                      <Badge 
                        variant="secondary" 
                        className={`${status.bgColor} ${status.color} border-transparent font-black uppercase tracking-widest text-[8px] px-1.5 sm:px-2 py-1 shadow-sm transition-transform group-hover:scale-105`}
                      >
                        <StatusIcon className={`h-2.5 w-2.5 mr-1 sm:mr-1.5 ${isAnimating ? 'animate-spin' : ''}`} />
                        {status.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
