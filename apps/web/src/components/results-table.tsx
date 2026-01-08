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
    bgColor: 'bg-muted hover:bg-muted',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-accent',
    bgColor: 'bg-accent/10 hover:bg-accent/10',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-secondary',
    bgColor: 'bg-secondary/10 hover:bg-secondary/10',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10 hover:bg-destructive/10',
    label: 'Failed',
  },
};

export function ResultsTable({ computation }: ResultsTableProps) {
  return (
    <Card className="bg-card border-border shadow-xl shadow-black/20 overflow-hidden border-t-4 border-t-secondary h-full flex flex-col w-full">
      <CardHeader className="bg-muted border-b border-border/50 h-[50px] sm:h-[70px] py-1.5 sm:py-2 px-2 sm:px-4">
        <div className="flex items-center justify-between w-full h-full">
          <div className="space-y-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CardTitle className="text-foreground text-sm sm:text-base font-black uppercase">
                Computation Engine
              </CardTitle>
              {/* Icons only for mobile */}
              <div className="flex items-center gap-1 sm:hidden">
                {computation.mode === 'ai' && (
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                )}
                {computation.fromCache && (
                  <Database className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
            </div>
            <div className="text-[8px] sm:text-[9px] text-foreground/40 font-black uppercase flex items-center gap-1.5 sm:gap-2">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-secondary"></span> A: {computation.a}</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent"></span> B: {computation.b}</span>
            </div>
          </div>
          {/* Badges with labels for desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {computation.mode === 'ai' && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground border-transparent font-black uppercase  text-[8px] px-2 py-1 shadow-lg shadow-accent/10">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                AI Enhanced
              </Badge>
            )}
            {computation.fromCache && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground border-transparent font-black uppercase  text-[8px] px-2 py-1 shadow-lg shadow-primary/10">
                <Database className="h-2.5 w-2.5 mr-1" />
                Cached
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-6 px-2 sm:px-6 flex-1 overflow-auto">
        {/* Total Progress */}
        <div className="mb-2 sm:mb-6 p-2 sm:p-4 bg-muted/50 rounded-lg sm:rounded-xl border border-border/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-0.5 sm:w-1 h-full bg-secondary"></div>
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-[8px] sm:text-[9px] font-black uppercase text-foreground/40">Total Execution Payload</span>
            <span className="text-xs sm:text-sm font-black text-secondary font-mono">{computation.totalProgress}%</span>
          </div>
          <Progress 
            value={computation.totalProgress} 
            className="h-2 sm:h-3 bg-muted border border-border shadow-inner"
          />
        </div>

        {/* Mobile Results - Card Layout */}
        <div className="sm:hidden space-y-1.5">
          {computation.results.map((result) => {
            const status = statusConfig[result.status];
            const StatusIcon = status.icon;
            const isAnimating = result.status === 'processing';
            
            return (
              <div key={result.operation} className="bg-muted/30 rounded-lg p-2 border border-border/30">
                <div className="flex items-center justify-between gap-2">
                  {/* Operation + Status Icon */}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${status.bgColor}`}>
                      <StatusIcon className={`h-3 w-3 ${status.color} ${isAnimating ? 'animate-spin' : ''}`} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-foreground">
                      {operationLabels[result.operation]}
                    </span>
                  </div>
                  
                  {/* Result Value */}
                  <div className="flex items-center gap-1 min-w-0">
                    {result.status === 'completed' && result.result !== null ? (
                      <span className="text-secondary font-mono font-black text-sm tabular-nums truncate" title={String(result.result)}>
                        {result.result}
                      </span>
                    ) : result.status === 'failed' && result.error ? (
                      <span className="text-destructive text-[8px] font-black uppercase truncate" title={result.error}>
                        Error
                      </span>
                    ) : (
                      <span className="text-foreground/20 text-[10px] font-mono">—</span>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress 
                    value={result.progress} 
                    className="h-1 flex-1 bg-muted border border-border/50"
                  />
                  <span className="text-[8px] font-black text-foreground/30 w-7 text-right font-mono">
                    {result.progress}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Results - Table Layout */}
        <div className="hidden sm:block rounded-2xl border border-border/50 overflow-hidden shadow-inner bg-muted/20">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-muted border-border/50 hover:bg-muted transition-none">
                <TableHead className="text-[9px] font-black uppercase text-foreground/40 py-2 px-4 w-[100px]">Operation</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-foreground/40 py-2 px-4 w-[180px]">Pipeline</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-foreground/40 py-2 px-4">Computed Value</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-foreground/40 text-right py-2 px-4 w-[120px]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {computation.results.map((result) => {
                const status = statusConfig[result.status];
                const StatusIcon = status.icon;
                const isAnimating = result.status === 'processing';
                
                return (
                  <TableRow key={result.operation} className="border-border/50 hover:bg-card transition-all group">
                    <TableCell className="text-foreground font-black uppercase text-xs py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-border group-hover:bg-secondary transition-colors rounded-full"></div>
                        {operationLabels[result.operation]}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={result.progress} 
                          className="h-1.5 flex-1 bg-muted border border-border/50"
                        />
                        <span className="text-[9px] font-black text-foreground/30 w-9 text-right font-mono">
                          {result.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground font-mono font-black text-base py-3.5 px-4 max-w-0">
                      <div className="min-h-[24px] flex items-center transition-opacity duration-300">
                        {result.status === 'completed' && result.result !== null ? (
                          <div className="flex items-center gap-2 min-w-0 animate-fade-in">
                            <span className="text-secondary tabular-nums truncate" title={String(result.result)}>{result.result}</span>
                            <CheckCircle2 className="h-4 w-4 text-secondary/30 shrink-0" />
                          </div>
                        ) : result.status === 'failed' && result.error ? (
                          <span className="text-destructive text-[10px] font-black uppercase leading-none bg-destructive/5 px-2 py-1 rounded border border-destructive/10 truncate block animate-fade-in" title={result.error}>{result.error}</span>
                        ) : (
                          <div className="flex items-center gap-1.5 opacity-10 transition-opacity duration-300">
                            <span className="w-8 h-1 bg-foreground rounded-full"></span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3.5 px-4">
                      <Badge 
                        variant="secondary" 
                        className={`${status.bgColor} ${status.color} border-transparent font-black uppercase text-[8px] px-2 py-1 shadow-sm`}
                      >
                        <StatusIcon className={`h-2.5 w-2.5 mr-1.5 ${isAnimating ? 'animate-spin' : ''}`} />
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
