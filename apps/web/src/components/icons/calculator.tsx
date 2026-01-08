import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: 'h-3.5 w-3.5',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

export function CalculatorIcon({ size = 'md', className }: CalculatorIconProps) {
  return (
    <Calculator className={cn(sizeConfig[size], 'text-foreground/40', className)} />
  );
}
