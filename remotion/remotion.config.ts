import { Config } from "@remotion/cli/config";

// Crisp output, predictable renders.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setColorSpace("bt709");
Config.setDelayRenderTimeoutInMilliseconds(60000);

// Optional: use a pre-installed Chromium instead of Remotion's download.
// Handy in locked-down CI/sandboxes — set REMOTION_BROWSER_EXECUTABLE to a
// Chrome/Chromium binary. Left unset on a normal machine, Remotion downloads
// its own Chrome Headless Shell automatically.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
