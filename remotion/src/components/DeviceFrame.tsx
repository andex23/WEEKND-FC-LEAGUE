import React from "react";
import { C, rgba } from "../theme";
import { MONO } from "../fonts";

interface DeviceFrameProps {
  children: React.ReactNode;
  url?: string;
  accent?: string;
  width?: number;
  style?: React.CSSProperties;
}

/**
 * A browser-window chrome that frames the recreated product screens, so the
 * trailer reads as a "web product" trailer (traffic lights + URL bar showing
 * weekendfc.online).
 */
export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  children,
  url = "weekendfc.online",
  accent = C.emerald,
  width = 820,
  style,
}) => {
  return (
    <div
      style={{
        width,
        borderRadius: 28,
        border: `1px solid ${C.border}`,
        background: C.card,
        overflow: "hidden",
        boxShadow: `0 50px 130px -40px ${rgba("#000000", 0.85)}, 0 0 0 1px ${rgba(
          accent,
          0.08,
        )}`,
        ...style,
      }}
    >
      {/* title bar */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 18,
          padding: "0 26px",
          background: C.cardDeep,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          <Dot color="#FF5F57" />
          <Dot color="#FEBC2E" />
          <Dot color="#28C840" />
        </div>
        <div
          style={{
            flex: 1,
            height: 38,
            borderRadius: 10,
            background: C.bg,
            border: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 16px",
            fontFamily: MONO,
            fontSize: 22,
            color: C.textDim,
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
            }}
          />
          {url}
        </div>
      </div>

      {/* top accent hairline */}
      <div
        style={{
          height: 2,
          background: `linear-gradient(90deg, transparent, ${rgba(accent, 0.7)}, transparent)`,
        }}
      />

      {children}
    </div>
  );
};

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    style={{ width: 15, height: 15, borderRadius: "50%", background: color }}
  />
);
