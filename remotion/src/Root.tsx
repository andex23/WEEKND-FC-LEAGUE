import React from "react";
import { Composition } from "remotion";
import { WeekendFCAd } from "./Video";
import { DURATION, FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="WeekendFCAd"
      component={WeekendFCAd}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
