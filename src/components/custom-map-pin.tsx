'use client';

import React from 'react';
import { LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomMapPinProps {
  icon: React.ElementType<LucideProps>;
  className?: string;
}

export function CustomMapPin({ icon: Icon, className }: CustomMapPinProps) {
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full bg-background border-2 border-foreground flex items-center justify-center shadow-md',
        className
      )}
    >
      <Icon className={cn('w-5 h-5 text-foreground', className)} />
    </div>
  );
}
