import React from "react";
import { C, rgba } from "../theme";
import { HEADING } from "../fonts";

interface PillProps {
  children: React.ReactNode;
  color?: string;
  dot?: boolean;
  icon?: React.ReactNode;
  fontSize?: number;
  style?: React.CSSProperties;
}

/** The signature Weekend FC status pill (emerald outline, tracking-wide caps). */
export const Pill: React.FC<PillProps> = ({
  children,
  color = C.emerald,
  dot = true,
  icon,
  fontSize = 24,
  style,
}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        borderRadius: 999,
        border: `1.5px solid ${rgba(color, 0.32)}`,
        background: rgba(color, 0.1),
        padding: "12px 26px",
        fontFamily: HEADING,
        fontSize,
        fontWeight: 700,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 12px ${color}`,
          }}
        />
      )}
      {icon}
      <span>{children}</span>
    </div>
  );
};
