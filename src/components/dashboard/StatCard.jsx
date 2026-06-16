import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 flex items-start gap-4">
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
        color === 'primary' && "bg-primary/10 text-primary",
        color === 'secondary' && "bg-secondary/40 text-foreground",
        color === 'green' && "bg-green-100 text-green-600",
        color === 'orange' && "bg-orange-100 text-orange-600",
        color === 'red' && "bg-red-100 text-red-600",
      )}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-semibold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}