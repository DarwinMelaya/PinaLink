import { useMemo } from "react";
import { useReducedMotion, type Variants } from "motion/react";

export const easeOut = [0.22, 1, 0.36, 1] as const;

export function useLandingVariants() {
  const reduce = useReducedMotion();

  return useMemo(() => {
    const fadeUp: Variants = {
      hidden: {
        opacity: 0,
        y: reduce ? 0 : 24,
        filter: reduce ? "blur(0px)" : "blur(6px)",
      },
      show: {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: { duration: reduce ? 0.01 : 0.6, ease: easeOut },
      },
    };

    const stagger: Variants = {
      hidden: {},
      show: {
        transition: {
          staggerChildren: reduce ? 0 : 0.1,
          delayChildren: reduce ? 0 : 0.06,
        },
      },
    };

    const cardIn: Variants = {
      hidden: {
        opacity: 0,
        y: reduce ? 0 : 32,
        scale: reduce ? 1 : 0.96,
      },
      show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 120, damping: 18 },
      },
    };

    return { reduce, fadeUp, stagger, cardIn };
  }, [reduce]);
}
