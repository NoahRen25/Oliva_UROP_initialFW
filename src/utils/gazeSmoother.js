/**
 * GazeSmoother — outlier/blink rejection filter.
 *
 * Sits between raw WebGazer output and React state.
 * WebGazer's built-in Kalman filter (fixed in 3.5.3) handles smoothing.
 * This class only rejects outliers (blinks, tracking losses, sudden jumps).
 */
export class GazeSmoother {
  constructor() {
    this._smoothed = null;       // last accepted point { x, y }
    this._consecutiveRejects = 0;
  }

  /**
   * Process a raw gaze point. Returns the point if accepted, null if rejected.
   * Outlier threshold is 15% of viewport diagonal — adapts to any screen size.
   */
  process(x, y) {
    if (x == null || y == null || isNaN(x) || isNaN(y)) return null;

    const raw = { x, y };

    // Calculate viewport-relative outlier threshold
    const threshold = Math.hypot(window.innerWidth, window.innerHeight) * 0.15;

    if (this._smoothed) {
      const dist = Math.hypot(raw.x - this._smoothed.x, raw.y - this._smoothed.y);

      if (dist > threshold) {
        this._consecutiveRejects++;
        // 3+ consecutive rejects = genuine movement, accept and reset
        if (this._consecutiveRejects >= 3) {
          this._consecutiveRejects = 0;
          this._smoothed = raw;
          return raw;
        }
        return null; // reject this frame
      }
    }

    this._consecutiveRejects = 0;

    // First frame or normal movement — accept
    this._smoothed = raw;
    return raw;
  }

  /** Clear state — call after recalibration */
  reset() {
    this._smoothed = null;
    this._consecutiveRejects = 0;
  }
}
