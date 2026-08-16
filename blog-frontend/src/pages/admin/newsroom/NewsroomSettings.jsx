import React from "react";
import { Settings as SettingsIcon } from "lucide-react";
import NewsroomPlaceholder from "./NewsroomPlaceholder";
import { newsroomT as t } from "@/lib/newsroomI18n";

export default function NewsroomSettings() {
  return (
    <NewsroomPlaceholder
      title={t.placeholders.settings.title}
      description={t.placeholders.settings.description}
      hint={t.placeholders.settings.hint}
      icon={SettingsIcon}
    />
  );
}
