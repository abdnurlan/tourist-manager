/**
 * Fixed atmosphere layers behind all content — part of the
 * "Səyahət Jurnalı" identity:
 *   - faint topographic contour lines (SVG, /topo.svg)
 *   - a very subtle fractal-noise film grain
 * Both are non-interactive and sit behind everything (z-0). The app
 * shell renders its content above these via a positioned wrapper.
 */
export function BackgroundTexture() {
  return (
    <>
      <div className="bg-topo" aria-hidden />
      <div className="bg-grain" aria-hidden />
    </>
  );
}
