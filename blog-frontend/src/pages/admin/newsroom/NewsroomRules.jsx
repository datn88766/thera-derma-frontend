import React from "react";
import { Workflow } from "lucide-react";
import NewsroomPlaceholder from "./NewsroomPlaceholder";
import { newsroomT as t } from "@/lib/newsroomI18n";

export default function NewsroomRules() {
  return (
    <NewsroomPlaceholder
      title={t.placeholders.rules.title}
      description={t.placeholders.rules.description}
      hint={t.placeholders.rules.hint}
      icon={Workflow}
    />
  );
}
