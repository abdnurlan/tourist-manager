"use client";

import { useState } from "react";
import { Compass, Plus, Star, Clock, Users, Pencil, Trash2, EyeOff } from "lucide-react";

import { PageHeader, PageBody } from "@/components/layout/page-header";
import { PageTransition, StaggerList, StaggerItem } from "@/components/shared/page-transition";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogTourForm } from "@/components/catalog/catalog-tour-form";

import {
  useCatalogTours,
  useCreateCatalogTour,
  useUpdateCatalogTour,
  useDeleteCatalogTour,
} from "@/lib/hooks/use-catalog-tours";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type { CatalogTour, CatalogTourPayload } from "@/lib/types";

function localized(m: Record<string, string>): string {
  return m.az || m.en || Object.values(m)[0] || "—";
}

export default function CatalogPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogTour | null>(null);
  const [deleting, setDeleting] = useState<CatalogTour | null>(null);

  const { data: tours, isLoading, isError, refetch } = useCatalogTours();
  const createTour = useCreateCatalogTour();
  const updateTour = useUpdateCatalogTour();
  const removeTour = useDeleteCatalogTour();

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(t: CatalogTour) {
    setEditing(t);
    setFormOpen(true);
  }
  function handleSubmit(payload: CatalogTourPayload) {
    if (editing) {
      updateTour.mutate({ id: editing.id, body: payload });
    } else {
      createTour.mutate(payload);
    }
    setFormOpen(false);
  }
  function confirmDelete() {
    if (!deleting) return;
    removeTour.mutate(deleting.id);
    setDeleting(null);
  }

  const submitting = editing ? updateTour.isPending : createTour.isPending;

  return (
    <PageTransition>
      <PageHeader
        title={az.catalog.title}
        actions={
          <Button onClick={openCreate} className="max-md:hidden">
            <Plus />
            {az.catalog.add}
          </Button>
        }
      />

      <PageBody className="space-y-5">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Compass}
            title={az.common.error_title}
            subtitle={az.common.error_subtitle}
            action={
              <Button variant="secondary" onClick={() => refetch()}>
                {az.action.retry}
              </Button>
            }
          />
        ) : !tours || tours.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={az.catalog.empty_title}
            subtitle={az.catalog.empty_subtitle}
            action={
              <Button onClick={openCreate}>
                <Plus />
                {az.catalog.add}
              </Button>
            }
          />
        ) : (
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tours.map((t) => (
              <StaggerItem key={t.id}>
                <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                  <div className="relative aspect-[16/10] overflow-hidden bg-surface-muted">
                    {t.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.image_url}
                        alt={localized(t.title)}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <Compass className="size-8" />
                      </div>
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                      {az.catalog.category[t.category]}
                    </span>
                    <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
                      <Star className="size-3.5 fill-terracotta text-terracotta" /> {t.rating}
                    </span>
                    {!t.published && (
                      <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-foreground/80 px-2 py-1 text-[11px] font-medium text-background">
                        <EyeOff className="size-3" /> {az.catalog.draft}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-xs text-muted-foreground">{localized(t.region)}</p>
                    <h3 className="mt-0.5 font-display text-lg font-semibold text-foreground">
                      {localized(t.title)}
                    </h3>

                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" /> {t.duration} {az.common.days}
                      </span>
                      {t.group_size && (
                        <span className="flex items-center gap-1">
                          <Users className="size-3.5" /> {t.group_size}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{az.catalog.perPerson}</p>
                        <p className="font-display text-xl font-semibold text-accent">{t.price} ₼</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={az.action.edit}
                          onClick={() => openEdit(t)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={az.action.delete}
                          onClick={() => setDeleting(t)}
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </PageBody>

      {/* Floating add button on mobile */}
      <Button
        onClick={openCreate}
        size="icon"
        className={cn(
          "fixed bottom-safe right-5 z-30 size-14 rounded-full shadow-lg md:hidden",
        )}
        aria-label={az.catalog.add}
      >
        <Plus className="size-6" />
      </Button>

      <CatalogTourForm
        open={formOpen}
        onOpenChange={setFormOpen}
        tour={editing}
        onSubmit={handleSubmit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={confirmDelete}
        description={az.catalog.delete_confirm}
        loading={removeTour.isPending}
      />
    </PageTransition>
  );
}
