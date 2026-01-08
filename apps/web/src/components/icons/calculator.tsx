import { Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'p-1.5 rounded-md',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    container: 'p-2 rounded-lg',
    icon: 'h-5 w-5',
  },
  lg: {
    container: 'p-3 rounded-xl',
    icon: 'h-8 w-8',
  },
};

export function CalculatorIcon({ size = 'md', className }: CalculatorIconProps) {
  const config = sizeConfig[size];
  
  return (
    <div className={cn(
      'bg-primary shadow-sm',
      config.container,
      className
    )}>
      <Calculator className={cn(config.icon, 'text-primary-foreground')} />
    </div>
  );
}
