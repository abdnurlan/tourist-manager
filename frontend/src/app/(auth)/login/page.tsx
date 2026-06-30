"use client";

import { motion } from "framer-motion";

import { BrandPanel } from "@/components/login/brand-panel";
import { LoginForm } from "@/components/login/login-form";
import { BackgroundTexture } from "@/components/layout/background-texture";
import { az } from "@/lib/i18n/az";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Giriş — immersive editorial login ("Səyahət Jurnalı").
 * Desktop: two-panel split — atmospheric brand panel (LEFT) + login form
 * on paper (RIGHT). Mobile: single column, brand atmosphere on top, form
 * below. Auth call + redirect + AZ errors live in <LoginForm/>.
 */
export default function LoginPage() {
  return (
    <main className="relative min-h-dvh w-full overflow-hidden bg-background">
      <BackgroundTexture />

      <div className="relative z-10 grid min-h-dvh grid-rows-[auto_1fr] lg:grid-cols-[1.05fr_1fr] lg:grid-rows-1">
        {/* ── LEFT / TOP: atmospheric brand panel ── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative border-b border-border lg:border-b-0 lg:border-r"
        >
          <BrandPanel />
        </motion.section>

        {/* ── RIGHT / BOTTOM: login form on paper ── */}
        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.12 }}
            className="w-full max-w-[400px]"
          >
            {/* heading */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.18 }}
              className="mb-7"
            >
              <span className="stamp text-[0.65rem] text-terracotta">
                {az.action.login}
              </span>
              <h2 className="mt-1.5 font-display text-h1 font-semibold tracking-tight text-foreground">
                {az.auth.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {az.auth.subtitle}
              </p>
            </motion.div>

            {/* paper card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.24 }}
              className="rounded-xl border border-border bg-surface p-6 shadow-md sm:p-7"
            >
              <LoginForm />
            </motion.div>

            {/* footer wordmark */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.42 }}
              className="mt-6 text-center font-display text-xs uppercase tracking-[0.18em] text-muted-foreground"
            >
              {az.app.name}
            </motion.p>
          </motion.div>
        </section>
      </div>
    </main>
  );
}
