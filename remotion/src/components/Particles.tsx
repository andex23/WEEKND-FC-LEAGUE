import React from "react";
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from "remotion";
import { C, rgba } from "../theme";

const COUNT = 42;
const COLORS = [C.emeraldLight, C.sky, C.white, C.emerald];

/**
 * Slow-drifting glow particles — deterministic via remotion's `random` so every
 * render is identical. They float upward, wrap around, and twinkle.
 */
export const Particles: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill>
      {new Array(COUNT).fill(0).map((_, i) => {
        const size = 1.5 + random(`size-${i}`) * 4;
        const speed = 0.25 + random(`speed-${i}`) * 0.9;
        const baseX = random(`x-${i}`) * width;
        const startY = random(`y-${i}`) * height;
        const drift = Math.sin(frame * 0.018 + i * 1.7) * 26;

        // travel up and wrap
        const rawY = startY - frame * speed * 2.2;
        const y = ((rawY % height) + height) % height;

        const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3));
        const color = COLORS[i % COLORS.length];

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: baseX + drift,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: color,
              opacity: twinkle * 0.5,
              boxShadow: `0 0 ${size * 4}px ${rgba(color, 0.8)}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
