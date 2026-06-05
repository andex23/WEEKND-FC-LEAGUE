import { interpolate, useCurrentFrame } from "remotion";
import { SCENE } from "./theme";

interface SceneOpts {
  /** frames for the enter fade (default 16) */
  in?: number;
  /** frames for the exit fade (default 12); pass 0 to hold the scene (final CTA) */
  out?: number;
  /** total length of the scene sequence (default 90) */
  len?: number;
}

/**
 * Shared scene timing. Because every scene sits on the SAME continuous dark
 * background, fading foreground content in/out reads as a smooth crossfade
 * between scenes without any hard cuts.
 */
export function useScene(opts: SceneOpts = {}) {
  const frame = useCurrentFrame();
  const len = opts.len ?? SCENE;
  const inDur = opts.in ?? 16;
  const outDur = opts.out ?? 12;

  const enter = interpolate(frame, [0, inDur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exit =
    outDur <= 0
      ? 1
      : interpolate(frame, [len - outDur, len], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  // Eased 0→1 progress across the whole scene — handy for slow Ken-Burns zooms.
  const through = interpolate(frame, [0, len], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return { frame, len, enter, exit, appear: enter * exit, through };
}
