import React from 'react';

const items = [
  'Body', 'Mind', 'Soul', 'Radiance', 'Balance', 'Harmony', 'Renewal', 'Vitality',
];

export default function MarqueeBanner() {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="py-6 overflow-hidden bg-muted/50 border-y border-border/40">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, idx) => (
          <span key={idx} className="mx-6 flex items-center gap-6">
            <span className="font-heading italic text-xl md:text-2xl text-foreground/30 font-light">
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
          </span>
        ))}
      </div>
    </div>
  );
}