"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { az } from "@/lib/i18n/az";

/** "Çıxış" — logout → clear token → /login. */
export function LogoutSection() {
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      // logout() clears the token (CONTRACT §8); redirect to /login.
      await logout();
      toast.success(az.toast.logout_success);
      router.replace("/login");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Card className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/12 text-danger">
            <LogOut className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-h3 font-semibold leading-tight tracking-tight text-foreground">
              {az.settings.logout_action}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {az.settings.logout_hint}
            </p>
          </div>
        </div>

        <Button
          variant="destructive"
          onClick={() => setOpen(true)}
          className="shrink-0 md:w-auto"
        >
          <LogOut className="size-4" />
          {az.action.logout}
        </Button>
      </Card>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={az.action.logout}
        description={az.auth.logout_confirm}
        confirmLabel={loading ? az.settings.logging_out : az.action.logout}
        cancelLabel={az.action.cancel}
        destructive
        loading={loading}
        onConfirm={handleConfirm}
      />
    </>
  );
}
