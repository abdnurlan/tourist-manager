"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, User as UserIcon, ArrowRight, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiClientError } from "@/lib/api/axios";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

// ── Schema (AZ validation messages, CONTRACT §9.7) ──────────────
const loginSchema = z.object({
  username: z.string().trim().min(1, az.validation.username_required),
  password: z.string().min(1, az.validation.password_required),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await login(values);
      toast.success(az.toast.login_success);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/");
    } catch (err) {
      // Surface the Azerbaijani message from the API error shape (CONTRACT §5).
      const message =
        err instanceof ApiClientError ? err.message : az.toast.error;
      setFormError(message);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08, delayChildren: 0.28 } },
      }}
    >
      {/* Username */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="username">{az.auth.username}</Label>
        <div className="relative">
          <UserIcon
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder={az.auth.username_placeholder}
            aria-invalid={Boolean(errors.username)}
            className={cn(
              "pl-10",
              errors.username && "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
            )}
            {...register("username")}
          />
        </div>
        {errors.username && (
          <p className="text-xs font-medium text-danger">{errors.username.message}</p>
        )}
      </motion.div>

      {/* Password */}
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
        }}
        className="flex flex-col gap-2"
      >
        <Label htmlFor="password">{az.auth.password}</Label>
        <div className="relative">
          <Lock
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={az.auth.password_placeholder}
            aria-invalid={Boolean(errors.password)}
            className={cn(
              "px-10",
              errors.password && "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
            )}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? az.action.close : az.action.confirm}
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-danger">{errors.password.message}</p>
        )}
      </motion.div>

      {/* API / credential error */}
      <AnimatePresence initial={false}>
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{formError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 8 },
          show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
        }}
      >
        <Button
          type="submit"
          size="lg"
          loading={isSubmitting}
          className="mt-1 w-full"
        >
          {isSubmitting ? az.auth.logging_in : az.auth.submit}
          {!isSubmitting && <ArrowRight className="size-4" />}
        </Button>
      </motion.div>
    </motion.form>
  );
}
