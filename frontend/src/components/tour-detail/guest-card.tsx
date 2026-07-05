"use client";

import { User, Phone, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Guest } from "@/lib/types";

export interface GuestCardProps {
  guest: Guest;
  onClick: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestCard({ guest, onClick, onDelete }: GuestCardProps) {
  return (
    <Card
      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-surface-muted"
      onClick={() => onClick(guest)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent">
        <User className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{guest.full_name}</p>
        {guest.phone && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Phone className="size-3" />
            {guest.phone}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-muted-foreground hover:text-danger"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(guest);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}
