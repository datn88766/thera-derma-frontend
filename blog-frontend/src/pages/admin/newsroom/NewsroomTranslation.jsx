import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, PenLine } from "lucide-react";
import NewsroomPlaceholder from "./NewsroomPlaceholder";

export default function NewsroomTranslation() {
  const navigate = useNavigate();

  return (
    <div className="px-4 lg:px-6 py-10">
      <NewsroomPlaceholder
        title="AI & Translation workspace"
        description="Side-by-side VI/EN review with AI rewrite, summarize, SEO and translation actions backed by Gemini."
        hint="Translation happens inline in the article editor"
        icon={Sparkles}
      />
      <div className="max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/admin/news/create?translate=1")}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          <Sparkles className="h-4 w-4" />
          New article with AI translate
        </button>
        <button
          type="button"
          onClick={() => navigate("/admin/news/create")}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-muted/50"
        >
          <PenLine className="h-4 w-4" />
          Open article editor
        </button>
      </div>
    </div>
  );
}
