import { BarChart3, Link2, WandSparkles, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import SectionHeading from "./SectionHeading";
import { useLandingVariants } from "./landingMotion";

type Step = {
  title: string;
  description: string;
  Icon: LucideIcon;
};

const STEPS: Step[] = [
  {
    title: "Paste your link",
    description: "Drop in any long URL and get a short, shareable link in one click.",
    Icon: Link2,
  },
  {
    title: "Customize & brand",
    description: "Pick a vanity code, style a QR with your logo, or attach it to a certificate.",
    Icon: WandSparkles,
  },
  {
    title: "Share & track",
    description: "Send it anywhere, then watch clicks and verify scans roll in.",
    Icon: BarChart3,
  },
];

const HowItWorksSection = () => {
  const { stagger, fadeUp } = useLandingVariants();

  return (
    <section id="how-it-works" className="scroll-mt-28 border-t border-white/5 py-wide">
      <div className="mx-auto max-w-container-max px-gutter">
        <SectionHeading
          eyebrow="How it works"
          title="From long URL to live link in seconds"
          description="No setup, no learning curve. Three steps and your audience is one tap away."
        />

        <div className="relative">
          <div
            className="pointer-events-none absolute left-[16%] right-[16%] top-6 hidden h-px bg-gradient-to-r from-transparent via-[var(--uw-cyan)]/40 to-transparent md:block"
            aria-hidden
          />
          <motion.ol
            className="relative grid grid-cols-1 gap-gutter md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={stagger}
          >
            {STEPS.map(({ title, description, Icon }, i) => (
              <motion.li
                key={title}
                variants={fadeUp}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-cozy flex size-12 items-center justify-center rounded-2xl border border-[var(--uw-cyan)]/30 bg-[var(--uw-card)] text-[var(--uw-cyan)] shadow-[0_0_24px_rgba(0,212,197,0.25)]">
                  <Icon size={22} aria-hidden />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-[var(--uw-cyan)] text-xs font-bold text-[var(--uw-on-accent)]">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mb-tight font-headline-md text-headline-md text-[var(--uw-text)]">
                  {title}
                </h3>
                <p className="max-w-xs text-[var(--uw-muted)]">{description}</p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
