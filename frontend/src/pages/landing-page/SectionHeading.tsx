import { motion } from "motion/react";
import { useLandingVariants } from "./landingMotion";

type SectionHeadingProps = {
  title: string;
  description: string;
};

const SectionHeading = ({ title, description }: SectionHeadingProps) => {
  const { fadeUp } = useLandingVariants();

  return (
    <motion.div
      className="mb-roomy max-w-2xl"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      variants={fadeUp}
    >
      <h2 className="mb-snug text-[clamp(26px,4vw,40px)] font-bold leading-tight tracking-tight text-[var(--uw-text)]">
        {title}
      </h2>
      <p className="font-body-lg text-body-lg text-[var(--uw-muted)]">{description}</p>
    </motion.div>
  );
};

export default SectionHeading;
