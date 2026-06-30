"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { ArrowUp, Mic, Square } from "lucide-react";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";

const composerSchema = z.object({
  message: z.string().trim().min(1),
});

type ComposerValues = z.infer<typeof composerSchema>;

interface ChatComposerProps {
  onSend: (message: string) => void;
  /** Receives a recorded audio blob to transcribe + run through the agent. */
  onVoice?: (audio: Blob) => void;
  disabled?: boolean;
  /** External text to load into the field (e.g. a tapped suggestion). */
  draft?: string;
  /** Changing nonce re-applies `draft` even when its text is unchanged. */
  draftNonce?: number;
}

/** Auto-growing chat input with voice. Enter sends, Shift+Enter newlines. */
export function ChatComposer({
  onSend,
  onVoice,
  disabled,
  draft,
  draftNonce,
}: ChatComposerProps) {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        setRecording(false);
        if (blob.size > 0) onVoice?.(blob);
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    watch,
    formState: { isValid },
  } = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    mode: "onChange",
    defaultValues: { message: "" },
  });

  const value = watch("message");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { ref: rhfRef, ...messageField } = register("message");

  // Load a tapped suggestion into the field and focus it.
  useEffect(() => {
    if (draft != null && draft !== "") {
      setValue("message", draft, { shouldValidate: true });
      setFocus("message");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftNonce]);

  // Auto-resize the textarea to its content.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = handleSubmit((values) => {
    onSend(values.message.trim());
    reset({ message: "" });
    const el = textareaRef.current;
    if (el) el.style.height = "auto";
  });

  return (
    <form
      onSubmit={submit}
      className={cn(
        "flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 pl-3 shadow-md",
        "focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/30 transition-colors",
      )}
    >
      <textarea
        {...messageField}
        ref={(el) => {
          rhfRef(el);
          textareaRef.current = el;
        }}
        rows={1}
        disabled={disabled}
        placeholder={az.ai.placeholder}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (isValid && !disabled) submit();
          }
        }}
        className={cn(
          "min-h-[40px] max-h-40 flex-1 resize-none bg-transparent px-2 py-2 text-body text-foreground",
          "placeholder:text-muted-foreground focus:outline-none disabled:opacity-50",
        )}
      />
      {onVoice && (
        <motion.button
          type="button"
          onClick={toggleRecording}
          disabled={disabled && !recording}
          whileTap={{ scale: 0.92 }}
          aria-label={recording ? "Dayandır" : "Səslə danış"}
          title={recording ? "Dayandır" : "Səslə danış"}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs transition-colors",
            recording
              ? "animate-pulse bg-danger text-white"
              : "bg-surface-muted text-muted-foreground hover:bg-accent-subtle hover:text-accent",
            "disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          {recording ? (
            <Square className="size-4" strokeWidth={2.75} />
          ) : (
            <Mic className="size-5" strokeWidth={2} />
          )}
        </motion.button>
      )}
      <motion.button
        type="submit"
        disabled={disabled || !isValid}
        whileTap={{ scale: 0.92 }}
        aria-label={az.ai.send}
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-xs transition-colors",
          "hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        <ArrowUp className="size-5" strokeWidth={2.5} />
      </motion.button>
    </form>
  );
}
