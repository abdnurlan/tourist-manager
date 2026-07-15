import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";

export interface TestimonialItem {
  id: string;
  text: string;
  image: string;
  name: string;
  role: string;
  rating?: number;
}

/** A single vertically-scrolling column of testimonial cards. */
function TestimonialsColumn(props: {
  className?: string;
  testimonials: TestimonialItem[];
  duration?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={props.className}>
      <motion.ul
        animate={reduce ? undefined : { translateY: "-50%" }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="m-0 flex list-none flex-col gap-6 p-0 pb-6"
      >
        {[0, 1].map((dup) => (
          <React.Fragment key={dup}>
            {props.testimonials.map((item, i) => (
              <motion.li
                key={`${dup}-${item.id}-${i}`}
                aria-hidden={dup === 1 ? "true" : "false"}
                tabIndex={dup === 1 ? -1 : 0}
                whileHover={{
                  scale: 1.02,
                  y: -6,
                  transition: { type: "spring", stiffness: 400, damping: 18 },
                }}
                className="group w-full max-w-xs cursor-default select-none rounded-3xl border border-border bg-card p-8 shadow-(--shadow-card) transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <blockquote className="m-0 p-0">
                  {item.rating != null && (
                    <div className="mb-4 flex items-center gap-1 text-accent">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${s < (item.rating ?? 0) ? "fill-accent" : "text-foreground/20"}`}
                        />
                      ))}
                    </div>
                  )}
                  <p className="m-0 leading-relaxed font-normal text-foreground/80">{item.text}</p>
                  <footer className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                    <img
                      width={44}
                      height={44}
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-11 w-11 rounded-full object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-accent/40"
                    />
                    <div className="flex flex-col">
                      <cite className="font-display text-base font-semibold not-italic leading-5 tracking-tight text-foreground">
                        {item.name}
                      </cite>
                      <span className="mt-0.5 text-sm leading-5 tracking-tight text-muted-foreground">
                        {item.role}
                      </span>
                    </div>
                  </footer>
                </blockquote>
              </motion.li>
            ))}
          </React.Fragment>
        ))}
      </motion.ul>
    </div>
  );
}

export interface TestimonialsMarqueeProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  testimonials: TestimonialItem[];
  /** Text direction — flips nothing structurally, columns stay vertical. */
  dir?: "ltr" | "rtl";
}

/**
 * Three vertically-scrolling columns of testimonials, masked top & bottom.
 * Fed by the site's own review data; styled with the M4STrip palette.
 */
export function TestimonialsMarquee({
  eyebrow,
  title,
  subtitle,
  testimonials,
  dir = "ltr",
}: TestimonialsMarqueeProps) {
  // Split into up-to-3 columns so each scrolls at a different pace.
  const col1 = testimonials.filter((_, i) => i % 3 === 0);
  const col2 = testimonials.filter((_, i) => i % 3 === 1);
  const col3 = testimonials.filter((_, i) => i % 3 === 2);

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="relative overflow-hidden py-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="z-10 mx-auto max-w-7xl px-6"
      >
        <div className="mx-auto mb-14 flex max-w-2xl flex-col items-start" dir={dir}>
          <p className="mb-3 text-sm uppercase tracking-widest text-accent">{eyebrow}</p>
          <h2 id="reviews-heading" className="font-display text-4xl font-medium tracking-tight md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-foreground/75">{subtitle}</p>
        </div>

        <div
          className="flex max-h-[720px] justify-center gap-6 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)]"
          role="region"
          aria-label={title}
        >
          <TestimonialsColumn testimonials={col1} duration={20} />
          <TestimonialsColumn testimonials={col2} duration={26} className="hidden md:block" />
          <TestimonialsColumn testimonials={col3} duration={23} className="hidden lg:block" />
        </div>
      </motion.div>
    </section>
  );
}
