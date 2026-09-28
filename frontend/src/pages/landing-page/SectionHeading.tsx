import { motion } from "motion/react";
import { useLandingVariants } from "./landingMotion";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

const SectionHeading = ({ eyebrow, title, description }: SectionHeadingProps) => {
  const { fadeUp, stagger } = useLandingVariants();

  return (
    <motion.div
      className="mx-auto mb-wide max-w-2xl text-center"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={stagger}
    >
      <motion.p
        variants={fadeUp}
        className="mb-snug font-label-sm text-label-sm uppercase tracking-widest text-[var(--uw-cyan)]"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        variants={fadeUp}
        className="mb-snug text-[clamp(26px,4vw,40px)] font-bold leading-tight tracking-tight text-[var(--uw-text)]"
      >
        {title}
      </motion.h2>
      <motion.p variants={fadeUp} className="font-body-lg text-body-lg text-[var(--uw-muted)]">
        {description}
      </motion.p>
    </motion.div>
  );
};

export default SectionHeading;
