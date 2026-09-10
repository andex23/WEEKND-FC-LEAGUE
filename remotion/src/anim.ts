import { Easing } from "remotion";

// Matches the site's CSS easings (globals.css)
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1); // fut-rise / fut-slide
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const EASE_BACK = Easing.bezier(0.34, 1.56, 0.64, 1); // fut-pop overshoot

// Reusable spring configs
export const SPRING_SOFT = { damping: 200, mass: 0.7, stiffness: 120 } as const;
export const SPRING_SMOOTH = { damping: 200, mass: 1, stiffness: 90 } as const;
export const SPRING_POP = { damping: 14, mass: 0.7, stiffness: 130 } as const;
