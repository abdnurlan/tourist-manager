import { motion, useReducedMotion } from "framer-motion";
import type { ElementType } from "react";

export interface TextSegment {
  text: string;
  /** Optional per-segment styling, e.g. the orange half of the hero headline. */
  className?: string;
}

interface SplitTextProps {
  /** Rendered in order, with one continuous stagger running across all of them. */
  segments: TextSegment[];
  /** Text direction. RTL splits by word — see the note on Arabic below. */
  dir?: "ltr" | "rtl";
  /** Seconds before the first piece animates. */
  delay?: number;
  /**
   * Seconds between pieces. Defaults per split mode: letters need a tight gap
   * to read as one sweep, whole words need a wider one to read as separate beats.
   */
  stagger?: number;
  as?: ElementType;
  className?: string;
}

/**
 * Reveals a headline piece by piece.
 *
 * Latin/Cyrillic scripts are split per letter. RTL scripts are split per *word*
 * on purpose: Arabic letters join contextually, and slicing a word into
 * separate inline boxes breaks that shaping into disconnected glyphs. Hebrew
 * survives a character split but loses niqqud pairing, so both use words.
 *
 * The container carries the full string as its accessible name and every piece
 * is hidden from assistive tech, so a screen reader still reads one sentence.
 */
export function SplitText({
  segments,
  dir = "ltr",
  delay = 0,
  stagger,
  as = "span",
  className = "",
}: SplitTextProps) {
  const Tag = motion[as as "span"] ?? motion.span;
  const reduce = useReducedMotion();
  const label = segments.map((s) => s.text).join(" ");

  if (reduce) {
    return (
      <Tag className={className}>
        {segments.map((s, i) => (
          <span key={i} className={s.className}>
            {i > 0 ? " " : ""}
            {s.text}
          </span>
        ))}
      </Tag>
    );
  }

  const splitBy = dir === "rtl" ? "word" : "char";
  const step = stagger ?? (splitBy === "word" ? 0.07 : 0.028);
  let index = -1;

  return (
    <Tag aria-label={label} className={className} initial="hidden" animate="show">
      {segments.map((segment, si) => (
        <span key={si} className={segment.className}>
          {si > 0 && " "}
          {/* Split on whitespace first. Each word keeps its own inline-block box,
              so per-letter animation can never break a word across two lines. */}
          {segment.text.split(/(\s+)/).map((word, wi) => {
            if (/^\s+$/.test(word)) return <span key={wi}>{word}</span>;
            const letters = splitBy === "word" ? [word] : Array.from(word);
            return (
              <span key={wi} className="inline-block whitespace-nowrap">
                {letters.map((piece, pi) => {
                  index += 1;
                  return (
                    <motion.span
                      key={pi}
                      aria-hidden="true"
                      className="inline-block will-change-[transform,opacity]"
                      variants={{
                        hidden: { opacity: 0, y: "0.4em" },
                        show: {
                          opacity: 1,
                          y: 0,
                          transition: {
                            duration: 0.5,
                            delay: delay + index * step,
                            ease: [0.16, 1, 0.3, 1],
                          },
                        },
                      }}
                    >
                      {piece}
                    </motion.span>
                  );
                })}
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
