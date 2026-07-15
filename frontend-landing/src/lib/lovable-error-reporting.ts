// Local no-op error reporter. (Lovable-specific reporting removed after export.)
export function reportLovableError(error: unknown, context?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.error("[error]", error, context);
  }
}
