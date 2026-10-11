import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Globe } from "lucide-react";

type RedirectLoaderProps = {
  code: string;
  destinationHost: string | null;
};

const TRAIL = "M 36 70 C 110 -6, 210 146, 284 70";
const PULSE_SECONDS = 1.6;

/** Full-screen loader shown while a short code resolves and the browser leaves the page. */
const RedirectLoader = ({ code, destinationHost }: RedirectLoaderProps) => {
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;

  return (
    <main className="user-workspace relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-1/2 size-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,212,197,0.16)_0%,rgba(0,43,91,0.12)_40%,transparent_70%)] ${
          animate ? "animate-[uw-glow-breathe_3.2s_ease-in-out_infinite]" : ""
        }`}
      />

      <motion.img
        src="/img/pinalink_logo.png"
        alt="Pinalink"
        className="absolute top-8 h-7 w-auto opacity-80"
        initial={animate ? { opacity: 0, y: -8 } : false}
        animate={{ opacity: 0.8, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      <motion.div
        className="relative w-full max-w-sm"
        initial={animate ? { opacity: 0, scale: 0.96 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <svg viewBox="0 25 320 90" className="w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id="redirect-trail" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#1b4f8a" />
              <stop offset="100%" stopColor="#00d4c5" />
            </linearGradient>
            <filter id="redirect-glow" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d={TRAIL}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
            strokeDasharray="2 7"
            strokeLinecap="round"
          />
          <motion.path
            d={TRAIL}
            fill="none"
            stroke="url(#redirect-trail)"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={animate ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
          />

          {animate
            ? [0, PULSE_SECONDS / 2].map((delay) => (
                <circle key={delay} r="4.5" fill="#00d4c5" filter="url(#redirect-glow)" opacity="0">
                  <animateMotion
                    dur={`${PULSE_SECONDS}s`}
                    begin={`${0.6 + delay}s`}
                    repeatCount="indefinite"
                    path={TRAIL}
                    keyPoints="0;1"
                    keyTimes="0;1"
                    calcMode="spline"
                    keySplines="0.45 0 0.55 1"
                  />
                  <animate
                    attributeName="opacity"
                    dur={`${PULSE_SECONDS}s`}
                    begin={`${0.6 + delay}s`}
                    repeatCount="indefinite"
                    values="0;1;1;0"
                    keyTimes="0;0.1;0.85;1"
                  />
                </circle>
              ))
            : null}

          <g>
            {animate ? (
              <circle cx="36" cy="70" r="10" fill="none" stroke="#00d4c5" strokeWidth="1.5">
                <animate
                  attributeName="r"
                  dur={`${PULSE_SECONDS}s`}
                  begin="0.6s"
                  repeatCount="indefinite"
                  values="10;22"
                />
                <animate
                  attributeName="opacity"
                  dur={`${PULSE_SECONDS}s`}
                  begin="0.6s"
                  repeatCount="indefinite"
                  values="0.6;0"
                />
              </circle>
            ) : null}
            <circle cx="36" cy="70" r="10" fill="#0f1624" stroke="#1b4f8a" strokeWidth="2" />
            <circle cx="36" cy="70" r="3.5" fill="#00d4c5" />
          </g>

          <g>
            {animate ? (
              <circle cx="284" cy="70" r="14" fill="none" stroke="#00d4c5" strokeWidth="1.5" opacity="0">
                <animate
                  attributeName="r"
                  dur={`${PULSE_SECONDS}s`}
                  begin="0.6s"
                  repeatCount="indefinite"
                  values="14;14;30"
                  keyTimes="0;0.85;1"
                />
                <animate
                  attributeName="opacity"
                  dur={`${PULSE_SECONDS}s`}
                  begin="0.6s"
                  repeatCount="indefinite"
                  values="0;0;0.8;0"
                  keyTimes="0;0.85;0.9;1"
                />
              </circle>
            ) : null}
            <circle cx="284" cy="70" r="14" fill="#0f1624" stroke="#00d4c5" strokeWidth="2" />
            <Globe x={276} y={62} size={16} color="#00d4c5" strokeWidth={1.75} />
          </g>
        </svg>

        <div className="relative mt-1 h-5 font-mono text-[13px]">
          <span className="absolute left-[7%] max-w-[43%] truncate text-[var(--uw-muted)]">
            /s/{code}
          </span>
          <AnimatePresence mode="wait" initial={false}>
            {destinationHost ? (
              <motion.span
                key="host"
                className="absolute right-[7%] max-w-[43%] truncate text-[var(--uw-cyan)]"
                initial={animate ? { opacity: 0, y: 4 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {destinationHost}
              </motion.span>
            ) : (
              <motion.span
                key="placeholder"
                aria-hidden
                className={`absolute right-[7%] top-1 h-3 w-20 rounded-full bg-white/10 ${animate ? "animate-pulse" : ""}`}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <p
        role="status"
        aria-live="polite"
        className="mt-10 text-center text-[15px] text-[var(--uw-muted)]"
      >
        {destinationHost ? (
          <>
            Taking you to{" "}
            <span className="font-medium text-[var(--uw-text)]">{destinationHost}</span>
          </>
        ) : (
          "Finding where this link goes…"
        )}
      </p>
    </main>
  );
};

export default RedirectLoader;
