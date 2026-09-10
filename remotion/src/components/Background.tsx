import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, rgba } from "../theme";
import { Particles } from "./Particles";

/**
 * Persistent, full-length backdrop shared by every scene. Keeping this
 * continuous (it never cuts) is what makes the scene-to-scene crossfades feel
 * seamless. Layers: deep radial base → drifting emerald/sky glow blobs →
 * scrolling tech grid → particles → vignette.
 */
export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // very slow global breathing so the whole frame feels alive
  const breathe = 0.5 + 0.5 * Math.sin(frame * 0.012);

  // grid slowly scrolls diagonally
  const gridX = interpolate(frame, [0, durationInFrames], [0, 90]);
  const gridY = interpolate(frame, [0, durationInFrames], [0, 140]);

  // glow blobs drift on lazy lissajous paths
  const emX = Math.sin(frame * 0.01) * 70;
  const emY = Math.cos(frame * 0.013) * 50;
  const skX = Math.cos(frame * 0.009) * 80;
  const skY = Math.sin(frame * 0.011) * 60;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      {/* base radial wash */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 80% at 50% 32%, ${C.bg} 0%, ${C.bgDeep} 70%, #040404 100%)`,
        }}
      />

      {/* emerald glow — top */}
      <div
        style={{
          position: "absolute",
          top: "-12%",
          left: "50%",
          width: 1300,
          height: 900,
          transform: `translate(calc(-50% + ${emX}px), ${emY}px)`,
          background: `radial-gradient(circle, ${rgba(C.emerald, 0.16)} 0%, ${rgba(
            C.emerald,
            0.05,
          )} 38%, transparent 66%)`,
          opacity: 0.85 + breathe * 0.15,
          filter: "blur(8px)",
        }}
      />

      {/* sky-blue glow — lower right */}
      <div
        style={{
          position: "absolute",
          bottom: "2%",
          right: "-14%",
          width: 1050,
          height: 1050,
          transform: `translate(${skX}px, ${skY}px)`,
          background: `radial-gradient(circle, ${rgba(C.sky, 0.13)} 0%, ${rgba(
            C.sky,
            0.04,
          )} 40%, transparent 68%)`,
          opacity: 0.75 + (1 - breathe) * 0.2,
          filter: "blur(8px)",
        }}
      />

      {/* faint amber glow — lower left for warmth */}
      <div
        style={{
          position: "absolute",
          bottom: "8%",
          left: "-16%",
          width: 820,
          height: 820,
          background: `radial-gradient(circle, ${rgba(C.amber, 0.06)} 0%, transparent 64%)`,
          filter: "blur(8px)",
        }}
      />

      {/* tech grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${rgba(C.emerald, 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${rgba(
            C.sky,
            0.045,
          )} 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          backgroundPosition: `${gridX}px ${gridY}px`,
          maskImage:
            "radial-gradient(120% 75% at 50% 40%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(120% 75% at 50% 40%, black 30%, transparent 85%)",
        }}
      />

      <Particles />
    </AbsoluteFill>
  );
};
