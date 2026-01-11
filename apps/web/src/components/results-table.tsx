'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GradientOrb } from '@/components/ui/gradient-orb';
import { CheckCircle2, XCircle, Clock, Sparkles, Database } from 'lucide-react';
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
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    label: 'Pending',
  },
  processing: {
    icon: null,
    color: 'text-accent-foreground',
    bgColor: 'gradient-purple',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-success-foreground',
    bgColor: 'gradient-green',
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
  const isProcessing = computation.status === 'processing' || computation.status === 'pending';
  
  return (
    <Card className="overflow-hidden h-full flex flex-col w-full">
      <CardHeader className="bg-gradient-to-r from-muted/80 to-muted/40 dark:from-muted/60 dark:to-muted/30 border-b border-border/50 h-[52px] py-2.5 px-3">
        <div className="flex items-center justify-between w-full h-full">
          <div className="flex items-center gap-2.5">
            {isProcessing ? (
              <GradientOrb variant="purple" size="sm" className="w-7 h-7" />
            ) : (
              <div className="w-7 h-7 rounded-full gradient-green flex items-center justify-center neu-raised-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-success-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-foreground text-sm font-semibold leading-tight">
                {isProcessing ? 'Computing...' : 'Results Ready'}
              </CardTitle>
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  A: {computation.a}
                </span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground"></span>
                  B: {computation.b}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {computation.mode === 'ai' && (
              <Badge variant="secondary" className="gradient-purple text-accent-foreground border-0 font-medium text-[9px] px-2 py-0.5 rounded-full neu-raised-sm">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                AI Mode
              </Badge>
            )}
            {computation.fromCache && (
              <Badge variant="secondary" className="gradient-blue text-secondary-foreground border-0 font-medium text-[9px] px-2 py-0.5 rounded-full neu-raised-sm">
                <Database className="h-2.5 w-2.5 mr-0.5" />
                Cached
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-3 px-3 flex-1 overflow-auto">
        {/* Total Progress */}
        <div className="mb-3 p-2 rounded-xl bg-muted/50 neu-pressed-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-semibold text-foreground tabular-nums">{computation.totalProgress}%</span>
          </div>
          <Progress value={computation.totalProgress} className="h-1.5" />
        </div>

        {/* Mobile Results */}
        <div className="sm:hidden space-y-1.5">
          {computation.results.map((result) => {
            const status = statusConfig[result.status];
            const StatusIcon = status.icon;
            const isAnimating = result.status === 'processing';
            
            return (
              <div key={result.operation} className="p-2 rounded-xl bg-card neu-flat">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isAnimating ? (
                      <GradientOrb variant="purple" size="sm" className="w-5 h-5" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${status.bgColor} neu-raised-sm`}>
                        {StatusIcon && <StatusIcon className={`h-2.5 w-2.5 ${status.color}`} />}
                      </div>
                    )}
                    <span className="text-xs font-semibold text-foreground">
                      {operationLabels[result.operation]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    {result.status === 'completed' && result.result !== null ? (
                      <span className="text-foreground font-mono font-semibold text-sm tabular-nums truncate">{result.result}</span>
                    ) : result.status === 'failed' ? (
                      <span className="text-destructive text-[10px] font-medium">Error</span>
                    ) : (
                      <span className="text-muted-foreground text-xs font-mono">—</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Progress value={result.progress} className="h-1 flex-1" />
                  <span className="text-[9px] font-medium text-muted-foreground w-7 text-right tabular-nums">{result.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Results */}
        <div className="hidden sm:block rounded-xl overflow-hidden neu-pressed-sm bg-muted/30">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50 border-0 hover:bg-muted/50">
                <TableHead className="text-[10px] font-semibold text-muted-foreground py-2 px-3 w-[80px]">Operation</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground py-2 px-3 w-[140px]">Progress</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground py-2 px-3">Result</TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground text-right py-2 px-3 w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computation.results.map((result) => {
                const status = statusConfig[result.status];
                const StatusIcon = status.icon;
                const isAnimating = result.status === 'processing';
                
                return (
                  <TableRow key={result.operation} className="border-0 hover:bg-card/50 transition-colors">
                    <TableCell className="text-foreground font-semibold text-xs py-2 px-3">
                      {operationLabels[result.operation]}
                    </TableCell>
                    <TableCell className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Progress value={result.progress} className="h-1 flex-1" />
                        <span className="text-[10px] font-medium text-muted-foreground w-8 text-right tabular-nums">{result.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono font-semibold text-sm py-2 px-3 max-w-0">
                      <div className="flex items-center">
                        {result.status === 'completed' && result.result !== null ? (
                          <div className="flex items-center gap-1.5 min-w-0 animate-fade-in">
                            <span className="tabular-nums truncate">{result.result}</span>
                            <CheckCircle2 className="h-3 w-3 text-success-foreground/50 shrink-0" />
                          </div>
                        ) : result.status === 'failed' && result.error ? (
                          <span className="text-destructive text-[10px] font-medium bg-destructive/10 px-1.5 py-0.5 rounded truncate animate-fade-in">{result.error}</span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-3">
                      {isAnimating ? (
                        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full gradient-purple neu-raised-sm">
                          <GradientOrb variant="purple" size="sm" className="w-3 h-3" />
                          <span className="text-[9px] font-semibold text-accent-foreground">{status.label}</span>
                        </div>
                      ) : (
                        <Badge variant="secondary" className={`${status.bgColor} ${status.color} border-0 font-semibold text-[9px] px-2 py-1 rounded-full neu-raised-sm`}>
                          {StatusIcon && <StatusIcon className="h-2.5 w-2.5 mr-1" />}
                          {status.label}
                        </Badge>
                      )}
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
