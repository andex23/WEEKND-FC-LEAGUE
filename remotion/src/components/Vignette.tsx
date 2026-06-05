import React from "react";
import { AbsoluteFill } from "remotion";
import { rgba, C } from "../theme";

/**
 * Top-most overlay: a soft vignette + a hair of top/bottom shading to focus the
 * eye on the centre. Sits above the scenes so everything is unified.
 */
export const Vignette: React.FC = () => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(110% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${rgba(C.bgDeep, 0.6)} 0%, transparent 16%, transparent 84%, ${rgba(
            C.bgDeep,
            0.7,
          )} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
