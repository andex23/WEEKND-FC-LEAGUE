import React from "react";
import { Img, staticFile } from "remotion";
import { C, rgba } from "../theme";

interface LogoProps {
  size?: number;
  glow?: number;
  ringColor?: string;
}

/**
 * The real Weekend FC badge (public/logo.png) presented as a glowing
 * circular medallion — the cream artwork is circle-cropped and framed with an
 * emerald rim so it reads as an intentional coin/crest on the dark canvas.
 */
export const Logo: React.FC<LogoProps> = ({
  size = 320,
  glow = 1,
  ringColor = C.emerald,
}) => {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* outer glow */}
      <div
        style={{
          position: "absolute",
          inset: "-22%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${rgba(ringColor, 0.5 * glow)} 0%, ${rgba(
            ringColor,
            0.12 * glow,
          )} 45%, transparent 70%)`,
          filter: "blur(26px)",
        }}
      />
      {/* coin */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          overflow: "hidden",
          border: `3px solid ${rgba(ringColor, 0.55)}`,
          boxShadow: `0 0 0 8px ${rgba("#000000", 0.4)}, 0 24px 60px -18px ${rgba(
            "#000000",
            0.9,
          )}, inset 0 0 40px ${rgba(ringColor, 0.25)}`,
        }}
      >
        <Img
          src={staticFile("logo.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.04)",
          }}
        />
      </div>
    </div>
  );
};
