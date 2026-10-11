import { useMemo } from "react";
import { useReducedMotion, type Variants } from "motion/react";

export function useLandingVariants() {
  const reduce = useReducedMotion();

  return useMemo(() => {
    const fadeUp: Variants = {
      hidden: { opacity: 0, y: reduce ? 0 : 12 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: reduce ? 0.01 : 0.4, ease: "easeOut" },
      },
    };

    const stagger: Variants = {
      hidden: {},
      show: { transition: { staggerChildren: reduce ? 0 : 0.06 } },
    };

    return { reduce, fadeUp, stagger };
  }, [reduce]);
}
