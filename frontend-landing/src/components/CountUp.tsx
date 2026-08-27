import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

/** Splits a stat like "8K+" into prefix / number / suffix. "4.9" keeps its decimal. */
const STAT = /^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/;

interface CountUpProps {
  /** The final display string, e.g. "40+", "8K+", "4.9". */
  value: string;
  /** Seconds. Longer than a micro-interaction on purpose: this is a data reveal. */
  duration?: number;
  /** Seconds to wait after entering the viewport — used to stagger a row of stats. */
  delay?: number;
  className?: string;
}

/**
 * Counts a stat up from zero the first time it scrolls into view.
 *
 * The final value is what renders on the server, so no-JS and crawlers see the
 * real number; the client resets it to zero only when it is actually going to
 * animate. Frames are written straight to the text node instead of through
 * state, so a row of these costs no React re-renders while running.
 */
export function CountUp({ value, duration = 1.1, delay = 0, className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();

  const parsed = STAT.exec(value);
  const target = parsed ? Number(parsed[2].replace(",", ".")) : 0;
  const decimals = parsed ? (parsed[2].split(/[.,]/)[1]?.length ?? 0) : 0;

  // Reset to zero on mount, before the first paint the user can see.
  useEffect(() => {
    if (reduce || !parsed || !numRef.current) return;
    numRef.current.textContent = (0).toFixed(decimals);
  }, [reduce, parsed, decimals]);

  useEffect(() => {
    if (reduce || !parsed || !inView) return;
    const node = numRef.current;
    if (!node) return;
    const controls = animate(0, target, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        node.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [inView, reduce, parsed, target, decimals, duration, delay]);

  if (!parsed) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      {parsed[1]}
      <span ref={numRef}>{target.toFixed(decimals)}</span>
      {parsed[3]}
    </span>
  );
}
