"use client";

import { Languages, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SettingsCard, SettingsRow } from "./settings-card";
import { az } from "@/lib/i18n/az";

const APP_VERSION = "1.0.0";

/** Dil — yalnız Azərbaycan dili. */
export function LanguageCard() {
  return (
    <SettingsCard
      icon={Languages}
      title={az.settings.language}
      description={az.settings.language_only}
    >
      <SettingsRow label={az.settings.language}>
        <Badge variant="accent">{az.settings.language_value}</Badge>
      </SettingsRow>
    </SettingsCard>
  );
}

/** Haqqında — tətbiq adı, versiya, qısa təsvir. */
export function AboutCard() {
  return (
    <SettingsCard icon={Info} title={az.settings.about}>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {az.settings.about_body}
      </p>
      <div className="mt-4 space-y-0">
        <SettingsRow label={az.app.name}>{az.app.tagline}</SettingsRow>
        <SettingsRow label={az.settings.version}>
          <span className="font-display tabular-nums">{APP_VERSION}</span>
        </SettingsRow>
      </div>
    </SettingsCard>
  );
}
