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
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    label: 'Pending',
  },
  processing: {
    icon: Loader2,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'Processing',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'Failed',
  },
};

export function ResultsTable({ computation }: ResultsTableProps) {
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg">
            Computation Results
          </CardTitle>
          <div className="flex items-center gap-2">
            {computation.mode === 'ai' && (
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Mode
              </Badge>
            )}
            {computation.fromCache && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                <Database className="h-3 w-3 mr-1" />
                Cached
              </Badge>
            )}
          </div>
        </div>
        <div className="text-sm text-slate-400">
          A = {computation.a}, B = {computation.b}
        </div>
      </CardHeader>
      <CardContent>
        {/* Total Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Total Progress</span>
            <span className="text-sm font-medium text-white">{computation.totalProgress}%</span>
          </div>
          <Progress 
            value={computation.totalProgress} 
            className="h-2 bg-slate-700"
          />
        </div>

        {/* Results Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-transparent">
              <TableHead className="text-slate-400">Operation</TableHead>
              <TableHead className="text-slate-400">Progress</TableHead>
              <TableHead className="text-slate-400">Result</TableHead>
              <TableHead className="text-slate-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {computation.results.map((result) => {
              const status = statusConfig[result.status];
              const StatusIcon = status.icon;
              const isAnimating = result.status === 'processing';
              
              return (
                <TableRow key={result.operation} className="border-slate-700">
                  <TableCell className="text-white font-medium">
                    {operationLabels[result.operation]}
                  </TableCell>
                  <TableCell className="w-[200px]">
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={result.progress} 
                        className="h-2 flex-1 bg-slate-700"
                      />
                      <span className="text-xs text-slate-400 w-10 text-right">
                        {result.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white">
                    {result.status === 'completed' && result.result !== null ? (
                      <span className="font-mono">{result.result}</span>
                    ) : result.status === 'failed' && result.error ? (
                      <span className="text-red-400 text-sm">{result.error}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant="secondary" 
                      className={`${status.bgColor} ${status.color} border-transparent`}
                    >
                      <StatusIcon className={`h-3 w-3 mr-1 ${isAnimating ? 'animate-spin' : ''}`} />
                      {status.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

