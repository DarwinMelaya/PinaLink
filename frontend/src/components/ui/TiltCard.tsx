import { useRef, type PointerEvent, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees on each axis. */
  intensity?: number;
  /** Lift toward the viewer on hover, in px. */
  lift?: number;
  /** Allow dragging the card around; it springs back on release. */
  drag?: boolean;
};

const TILT_SPRING = { stiffness: 220, damping: 22, mass: 0.6 } as const;

/**
 * Pointer-reactive 3D card: tilts toward the cursor, lifts on hover, and paints
 * a specular highlight that tracks the pointer.
 *
 * Reduced motion drops the hover tilt and glare, but keeps dragging when the
 * caller asked for it — a drag only moves because the user moved it.
 */
const TiltCard = ({
  children,
  className = "",
  intensity = 9,
  lift = 18,
  drag = false,
}: TiltCardProps) => {
  const reduce = useReducedMotion();
  const sceneRef = useRef<HTMLDivElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const hover = useMotionValue(0);

  const smoothX = useSpring(pointerX, TILT_SPRING);
  const smoothY = useSpring(pointerY, TILT_SPRING);
  const smoothHover = useSpring(hover, TILT_SPRING);

  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-intensity, intensity]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [intensity, -intensity]);
  const translateZ = useTransform(smoothHover, [0, 1], [0, lift]);

  const glareX = useTransform(smoothX, (v) => `${50 + v * 90}%`);
  const glareY = useTransform(smoothY, (v) => `${50 + v * 90}%`);
  const glareOpacity = useTransform(smoothHover, [0, 1], [0, 0.55]);
  const glare = useMotionTemplate`radial-gradient(120% 90% at ${glareX} ${glareY}, rgba(255,255,255,0.35), rgba(255,255,255,0.08) 38%, transparent 70%)`;

  // Brand bloom behind the card. Under reduced motion the pointer values never
  // update, so this settles into a static centred glow instead of switching off.
  const glowOpacity = useTransform(smoothHover, [0, 1], [0.3, 0.95]);
  const glow = useMotionTemplate`radial-gradient(62% 62% at ${glareX} ${glareY}, rgba(0,212,197,0.6), rgba(0,43,91,0.34) 55%, transparent 78%)`;

  function trackPointer(event: PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
    hover.set(0);
  }

  return (
    <div
      ref={sceneRef}
      className="tilt-scene"
      onPointerMove={trackPointer}
      onPointerEnter={() => {
        if (!reduce) hover.set(1);
      }}
      onPointerLeave={resetPointer}
      onPointerCancel={resetPointer}
    >
      <motion.span
        className="tilt-glow"
        style={{ backgroundImage: glow, opacity: glowOpacity }}
        aria-hidden
      />
      <motion.div
        className={`tilt-card ${className}`}
        style={reduce ? undefined : { rotateX, rotateY, translateZ }}
        drag={drag}
        dragSnapToOrigin
        dragMomentum={false}
        dragElastic={0.18}
        whileTap={drag ? { cursor: "grabbing" } : undefined}
      >
        {children}
        {reduce ? null : (
          <motion.span
            className="tilt-glare"
            style={{ backgroundImage: glare, opacity: glareOpacity }}
            aria-hidden
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
