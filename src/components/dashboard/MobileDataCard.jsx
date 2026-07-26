import React from 'react';

export function DashboardMobileList({ loading, empty, emptyMessage = 'Không có dữ liệu', children }) {
  if (loading) {
    return (
      <div className="md:hidden flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (empty) {
    return (
      <div className="md:hidden px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }
  return <div className="md:hidden divide-y divide-border">{children}</div>;
}

export function DashboardMobileCard({ title, subtitle, badges, meta = [], actions }) {
  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {title && <p className="text-sm font-semibold text-foreground leading-snug">{title}</p>}
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5 break-all">{subtitle}</p>}
        </div>
        {badges && <div className="flex flex-wrap gap-1.5 justify-end shrink-0">{badges}</div>}
      </div>
      {meta.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {meta.map((item) => (
            <div key={item.label} className={item.full ? 'col-span-2' : ''}>
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-medium text-foreground mt-0.5">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {actions && <div className="flex items-center gap-1 pt-1 border-t border-border/60">{actions}</div>}
    </div>
  );
}
