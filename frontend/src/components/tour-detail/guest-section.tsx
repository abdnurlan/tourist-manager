"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GuestCard } from "./guest-card";
import { GuestFormSheet } from "./guest-form-sheet";
import {
  useTourGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
} from "@/lib/hooks/use-guests";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, Guest } from "@/lib/types";

export function GuestSection({ tourId }: { tourId: string }) {
  const { data: guests = [] } = useTourGuests(tourId);
  const createM = useCreateGuest(tourId);
  const updateM = useUpdateGuest(tourId);
  const deleteM = useDeleteGuest(tourId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | undefined>();
  const [toDelete, setToDelete] = useState<Guest | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };
  const openEdit = (g: Guest) => {
    setEditing(g);
    setSheetOpen(true);
  };

  const submit = (body: CreateGuestRequest) => {
    if (editing) {
      updateM.mutate(
        { id: editing.id, body },
        { onSuccess: () => setSheetOpen(false) },
      );
    } else {
      createM.mutate(body, { onSuccess: () => setSheetOpen(false) });
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h3 font-semibold tracking-tight text-foreground">
          <Users className="size-5 text-accent" />
          {az.guest.section_title}
          <span className="text-muted-foreground">({guests.length})</span>
        </h2>
        <Button variant="ghost" size="sm" className="text-accent" onClick={openCreate}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">{az.guest.add}</span>
        </Button>
      </div>

      {guests.length === 0 ? (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          {az.guest.empty_subtitle}
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {guests.map((g) => (
            <GuestCard key={g.id} guest={g} onClick={openEdit} onDelete={setToDelete} />
          ))}
        </div>
      )}

      <GuestFormSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(undefined);
        }}
        guest={editing}
        submitting={createM.isPending || updateM.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title={az.guest.delete_confirm}
        loading={deleteM.isPending}
        onConfirm={() =>
          toDelete &&
          deleteM.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })
        }
      />
    </section>
  );
}
