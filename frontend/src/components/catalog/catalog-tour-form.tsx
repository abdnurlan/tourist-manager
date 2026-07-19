"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadImage } from "@/lib/api/uploads";
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { az } from "@/lib/i18n/az";
import type { CatalogCategory, CatalogTour, CatalogTourPayload } from "@/lib/types";

const CATEGORIES: CatalogCategory[] = ["mountain", "history", "nature", "wellness", "coast", "offroad"];
// Extra languages beyond AZ, editable in a collapsible section.
const EXTRA_LANGS: Array<{ code: string; label: string }> = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "ar", label: "AR" },
  { code: "he", label: "HE" },
];

interface CatalogTourFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: CatalogTour | null;
  onSubmit: (payload: CatalogTourPayload) => void;
  submitting?: boolean;
}

interface FormState {
  slug: string;
  category: CatalogCategory;
  price: string;
  rating: string;
  duration: string;
  group_size: string;
  image_url: string;
  published: boolean;
  title: Record<string, string>;
  region: Record<string, string>;
  overview: Record<string, string>;
}

function emptyState(): FormState {
  return {
    slug: "",
    category: "mountain",
    price: "",
    rating: "5",
    duration: "1",
    group_size: "",
    image_url: "",
    published: true,
    title: {},
    region: {},
    overview: {},
  };
}

function fromTour(t: CatalogTour): FormState {
  return {
    slug: t.slug,
    category: t.category,
    price: String(t.price),
    rating: String(t.rating),
    duration: String(t.duration),
    group_size: t.group_size,
    image_url: t.image_url,
    published: t.published,
    title: { ...t.title },
    region: { ...t.region },
    overview: { ...t.overview },
  };
}

const GField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-xs text-danger">{error}</p>}
  </div>
);

export function CatalogTourForm({ open, onOpenChange, tour, onSubmit, submitting }: CatalogTourFormProps) {
  const [s, setS] = useState<FormState>(emptyState());
  const [showLangs, setShowLangs] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formId = "catalog-tour-form";

  useEffect(() => {
    if (open) {
      setS(tour ? fromTour(tour) : emptyState());
      setErrors({});
      setShowLangs(false);
      setUploading(false);
    }
  }, [open, tour]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-selecting the same file next time.
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setErrors((prev) => ({ ...prev, image: "" }));
    try {
      const url = await uploadImage(file);
      setS((prev) => ({ ...prev, image_url: url }));
    } catch {
      setErrors((prev) => ({ ...prev, image: az.catalog.fields.image_upload_error }));
    } finally {
      setUploading(false);
    }
  }

  function setLang(field: "title" | "region" | "overview", code: string, val: string) {
    setS((prev) => ({ ...prev, [field]: { ...prev[field], [code]: val } }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!s.slug.trim()) next.slug = az.catalog.slug_required;
    if (!s.title.az?.trim()) next.title = az.catalog.title_required;
    if (!s.price.trim() || Number.isNaN(Number(s.price))) next.price = az.catalog.price_required;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Drop empty-string language entries so the payload stays clean.
    const clean = (m: Record<string, string>) =>
      Object.fromEntries(Object.entries(m).filter(([, v]) => v.trim() !== ""));

    onSubmit({
      slug: s.slug.trim(),
      category: s.category,
      price: Number(s.price),
      rating: Number(s.rating) || 5,
      duration: Number(s.duration) || 1,
      group_size: s.group_size.trim(),
      image_url: s.image_url.trim(),
      published: s.published,
      title: clean(s.title),
      region: clean(s.region),
      overview: clean(s.overview),
    });
  }

  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={tour ? az.catalog.edit : az.catalog.add}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {az.action.cancel}
          </Button>
          <Button type="submit" form={formId} loading={submitting}>
            {az.action.save}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-4">
        <GField label={az.catalog.fields.title_az} error={errors.title}>
          <Input
            value={s.title.az ?? ""}
            onChange={(e) => setLang("title", "az", e.target.value)}
            placeholder="Xınalıq və Qubanın Dağları"
          />
        </GField>

        <div className="grid grid-cols-2 gap-3">
          <GField label={az.catalog.fields.slug} error={errors.slug}>
            <Input value={s.slug} onChange={(e) => setS({ ...s, slug: e.target.value })} placeholder="khinalug" />
          </GField>
          <GField label={az.catalog.fields.category}>
            <Select value={s.category} onValueChange={(v) => setS({ ...s, category: v as CatalogCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{az.catalog.category[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </GField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <GField label={az.catalog.fields.price} error={errors.price}>
            <Input inputMode="numeric" value={s.price} onChange={(e) => setS({ ...s, price: e.target.value })} placeholder="220" />
          </GField>
          <GField label={az.catalog.fields.duration}>
            <Input inputMode="numeric" value={s.duration} onChange={(e) => setS({ ...s, duration: e.target.value })} placeholder="2" />
          </GField>
          <GField label={az.catalog.fields.rating}>
            <Input inputMode="decimal" value={s.rating} onChange={(e) => setS({ ...s, rating: e.target.value })} placeholder="4.9" />
          </GField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GField label={az.catalog.fields.group_size}>
            <Input value={s.group_size} onChange={(e) => setS({ ...s, group_size: e.target.value })} placeholder="4–12" />
          </GField>
          <GField label={az.catalog.fields.region_az}>
            <Input value={s.region.az ?? ""} onChange={(e) => setLang("region", "az", e.target.value)} placeholder="Quba · Xınalıq" />
          </GField>
        </div>

        <GField label={az.catalog.fields.image_url} error={errors.image}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={handleFileChange}
          />
          {s.image_url ? (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image_url}
                alt=""
                className="h-16 w-24 shrink-0 rounded-lg border border-border object-cover"
              />
              <div className="flex flex-1 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      {az.catalog.fields.image_uploading}
                    </>
                  ) : (
                    az.catalog.fields.image_change
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={() => setS({ ...s, image_url: "" })}
                >
                  <X className="mr-1 h-4 w-4" />
                  {az.catalog.fields.image_remove}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-6 text-sm text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <ImagePlus className="h-6 w-6" />
              )}
              <span>{uploading ? az.catalog.fields.image_uploading : az.catalog.fields.image_choose}</span>
              <span className="text-xs">{az.catalog.fields.image_hint}</span>
            </button>
          )}
        </GField>

        <GField label={az.catalog.fields.overview_az}>
          <Textarea
            rows={3}
            value={s.overview.az ?? ""}
            onChange={(e) => setLang("overview", "az", e.target.value)}
            placeholder="Turun qısa təsviri..."
          />
        </GField>

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted/40 px-4 py-3">
          <Label htmlFor="published">{az.catalog.fields.published}</Label>
          <Switch
            id="published"
            checked={s.published}
            onCheckedChange={(v) => setS({ ...s, published: v })}
          />
        </div>

        {/* Optional: other-language translations */}
        <button
          type="button"
          onClick={() => setShowLangs((v) => !v)}
          className="text-sm font-medium text-accent hover:underline"
        >
          {showLangs ? "− " : "+ "}
          {EXTRA_LANGS.map((l) => l.label).join(" / ")}
        </button>

        {showLangs && (
          <div className="space-y-4 rounded-xl border border-border p-4">
            {EXTRA_LANGS.map((l) => (
              <div key={l.code} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{l.label}</p>
                <Input
                  value={s.title[l.code] ?? ""}
                  onChange={(e) => setLang("title", l.code, e.target.value)}
                  placeholder={`${az.catalog.fields.title_az.replace("(AZ)", `(${l.label})`)}`}
                />
                <Input
                  value={s.region[l.code] ?? ""}
                  onChange={(e) => setLang("region", l.code, e.target.value)}
                  placeholder={`${az.catalog.fields.region_az.replace("(AZ)", `(${l.label})`)}`}
                />
                <Textarea
                  rows={2}
                  value={s.overview[l.code] ?? ""}
                  onChange={(e) => setLang("overview", l.code, e.target.value)}
                  placeholder={`${az.catalog.fields.overview_az.replace("(AZ)", `(${l.label})`)}`}
                />
              </div>
            ))}
          </div>
        )}
      </form>
    </BottomSheetForm>
  );
}
