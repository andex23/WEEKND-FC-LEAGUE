import React from "react";
import { AbsoluteFill } from "remotion";
import { C, rgba } from "../theme";
import { HEADING, MONO } from "../fonts";
import { useScene } from "../useScene";
import { Reveal } from "../components/Reveal";
import { Pill } from "../components/Pill";
import { Crest } from "../components/Crest";

interface Fx {
  home: string;
  homeClub: string;
  homeColor: string;
  away: string;
  awayClub: string;
  awayColor: string;
  time: string;
  next?: boolean;
}

const FIXTURES: Fx[] = [
  { home: "Marcus", homeClub: "Arsenal", homeColor: "#EF4444", away: "Leo", awayClub: "Man City", awayColor: "#38BDF8", time: "SAT 19:00", next: true },
  { home: "Sofia", homeClub: "Chelsea", homeColor: "#3B82F6", away: "Diego", awayClub: "Barcelona", awayColor: "#A855F7", time: "SAT 20:30" },
  { home: "Yuki", homeClub: "PSG", homeColor: "#6366F1", away: "Tom", awayClub: "Inter", awayColor: "#0EA5E9", time: "SUN 18:00" },
  { home: "Ade", homeClub: "Liverpool", homeColor: "#F43F5E", away: "Noah", awayClub: "Juventus", awayColor: "#E5E7EB", time: "SUN 19:30" },
  { home: "Priya", homeClub: "Spurs", homeColor: "#F5C54A", away: "Sam", awayClub: "Bayern", awayColor: "#EF4444", time: "SUN 21:00" },
];

/** 6–9s · Weekend fixtures cards sliding in from the right. */
export const SceneFixtures: React.FC = () => {
  const { appear } = useScene();

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: appear }}>
      <div style={{ width: 900, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Reveal delay={2} y={-16}>
          <Pill fontSize={24} icon={<span style={{ fontSize: 22 }}>📅</span>} dot={false}>
            Matchday 01
          </Pill>
        </Reveal>

        <Reveal delay={6} y={28} blur={10} style={{ marginTop: 28 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: HEADING,
              fontWeight: 900,
              fontSize: 78,
              textTransform: "uppercase",
              color: C.white,
              textAlign: "center",
              letterSpacing: "-0.01em",
            }}
          >
            Get weekend <span style={{ color: C.emeraldLight }}>fixtures</span>
          </h2>
        </Reveal>

        <Reveal delay={12} y={16} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: MONO, fontSize: 26, color: C.textDim, letterSpacing: "0.06em" }}>
            Round-robin · Played from home
          </div>
        </Reveal>

        <div style={{ width: "100%", marginTop: 44, display: "flex", flexDirection: "column", gap: 18 }}>
          {FIXTURES.map((f, i) => (
            <Reveal key={i} delay={18 + i * 8} x={180} y={0} blur={18}>
              <FixtureRow fx={f} />
            </Reveal>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FixtureRow: React.FC<{ fx: Fx }> = ({ fx }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: 104,
        padding: "0 28px",
        borderRadius: 18,
        background: C.cardDeep,
        border: `1px solid ${fx.next ? rgba(C.emerald, 0.5) : C.border}`,
        boxShadow: fx.next ? `0 0 40px -10px ${rgba(C.emerald, 0.4)}` : "none",
      }}
    >
      {/* home */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
        <Crest team={fx.homeClub} color={fx.homeColor} size={52} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 30, color: C.white }}>{fx.home}</div>
          <div style={{ fontFamily: MONO, fontSize: 19, color: C.textFaint }}>{fx.homeClub}</div>
        </div>
      </div>

      {/* center */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, width: 180 }}>
        <div
          style={{
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "0.04em",
            color: fx.next ? C.emeraldLight : C.textDim,
            background: fx.next ? rgba(C.emerald, 0.12) : C.bg,
            border: `1px solid ${fx.next ? rgba(C.emerald, 0.4) : C.border}`,
            padding: "8px 18px",
            borderRadius: 10,
          }}
        >
          {fx.time}
        </div>
        {fx.next && (
          <div style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 15, letterSpacing: "0.2em", color: C.emeraldLight }}>
            NEXT UP
          </div>
        )}
      </div>

      {/* away */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 18, minWidth: 0, textAlign: "right" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: HEADING, fontWeight: 700, fontSize: 30, color: C.white }}>{fx.away}</div>
          <div style={{ fontFamily: MONO, fontSize: 19, color: C.textFaint }}>{fx.awayClub}</div>
        </div>
        <Crest team={fx.awayClub} color={fx.awayColor} size={52} />
      </div>
    </div>
  );
};
