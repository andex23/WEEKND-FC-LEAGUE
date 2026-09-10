import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SPRING_SOFT } from "../anim";

interface RevealProps {
  delay?: number;
  /** vertical slide-in distance in px (positive = comes from below) */
  y?: number;
  /** horizontal slide-in distance in px (positive = comes from the right) */
  x?: number;
  /** starting scale */
  scaleFrom?: number;
  /** peak blur in px while moving — gives a light motion-blur smear */
  blur?: number;
  config?: { damping: number; mass: number; stiffness: number };
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}

/**
 * The workhorse entrance animation: spring-driven fade + slide (+ optional
 * scale) with a velocity-style blur that resolves to crisp. Used for every
 * text fade-in and card slide-in in the trailer.
 */
export const Reveal: React.FC<RevealProps> = ({
  delay = 0,
  y = 28,
  x = 0,
  scaleFrom = 1,
  blur = 8,
  config = SPRING_SOFT,
  style,
  className,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const s = spring({ frame: frame - delay, fps, config });

  const opacity = interpolate(s, [0, 1], [0, 1], { extrapolateRight: "clamp" });
  const b = interpolate(s, [0, 1], [blur, 0], { extrapolateRight: "clamp" });
  const sc = interpolate(s, [0, 1], [scaleFrom, 1]);
  const tx = (1 - s) * x;
  const ty = (1 - s) * y;

  return (
    <div
      className={className}
      style={{
        opacity,
        transform: `translate3d(${tx}px, ${ty}px, 0) scale(${sc})`,
        filter: b > 0.15 ? `blur(${b}px)` : undefined,
        willChange: "transform, opacity, filter",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
