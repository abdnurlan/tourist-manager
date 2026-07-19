import type { ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/use-reveal";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  stagger?: boolean;
  id?: string;
};

/**
 * Wraps content in a scroll-reveal container.
 * `stagger` cascades direct children (they animate in sequence).
 */
export function Reveal({ children, as, className = "", stagger = false, id }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const { ref, revealed } = useReveal<HTMLElement>();
  const base = stagger ? "reveal-stagger" : "reveal";
  return (
    <Tag
      ref={ref}
      id={id}
      className={`${base}${revealed ? " is-revealed" : ""} ${className}`}
    >
      {children}
    </Tag>
  );
}
