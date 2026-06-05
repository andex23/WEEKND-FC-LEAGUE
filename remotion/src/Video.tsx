import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { C, SCENE } from "./theme";
import { Background } from "./components/Background";
import { Vignette } from "./components/Vignette";
import { SceneHome } from "./scenes/SceneHome";
import { SceneRegister } from "./scenes/SceneRegister";
import { SceneFixtures } from "./scenes/SceneFixtures";
import { SceneStandings } from "./scenes/SceneStandings";
import { SceneCTA } from "./scenes/SceneCTA";

/**
 * Weekend FC — 15s vertical (1080×1920) promo.
 *
 * A single continuous animated background runs underneath all five scenes, so
 * the per-scene fade in/out reads as a seamless crossfade. Scenes:
 *   0–3s   Home / brand open      → "Online EA FC League"
 *   3–6s   Registration           → "Register from home"
 *   6–9s   Weekend fixtures        → "Get weekend fixtures"
 *   9–12s  Standings climb         → "Report scores. Climb the table."
 *   12–15s CTA                     → "Season 1 Open · weekendfc.online · Register Now"
 */
export const WeekendFCAd: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <Background />

      <Sequence durationInFrames={SCENE} name="Home">
        <SceneHome />
      </Sequence>
      <Sequence from={SCENE} durationInFrames={SCENE} name="Register">
        <SceneRegister />
      </Sequence>
      <Sequence from={SCENE * 2} durationInFrames={SCENE} name="Fixtures">
        <SceneFixtures />
      </Sequence>
      <Sequence from={SCENE * 3} durationInFrames={SCENE} name="Standings">
        <SceneStandings />
      </Sequence>
      <Sequence from={SCENE * 4} durationInFrames={SCENE} name="CTA">
        <SceneCTA />
      </Sequence>

      <Vignette />
    </AbsoluteFill>
  );
};
