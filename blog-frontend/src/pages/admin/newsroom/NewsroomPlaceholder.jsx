import React from "react";
import { Sparkles, Construction } from "lucide-react";

export default function NewsroomPlaceholder({
  title,
  description,
  hint,
  icon: Icon = Construction,
}) {
  return (
    <div className="px-4 lg:px-6 py-10">
      <div className="max-w-2xl mx-auto rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
        <div className="h-12 w-12 mx-auto rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-3">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
        ) : null}
        {hint ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3 text-accent" />
            {hint}
          </div>
        ) : null}
      </div>
    </div>
  );
}
