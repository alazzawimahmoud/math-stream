import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
          <span className="text-slate-400">Loading MathStream...</span>
        </CardContent>
      </Card>
    </div>
  );
}

