/**
 * GazeSmoother — multi-stage gaze data processing pipeline.
 *
 * Sits between raw WebGazer output and React state to provide:
 *   1. Outlier / blink rejection
 *   2. Exponential Moving Average (EMA) smoothing
 *   3. Adaptive velocity dampening
 */

export class GazeSmoother {
  constructor({
    alpha = 0.25,
    outlierThreshold = 300,
    historySize = 5,
    warmupFrames = 10,
  } = {}) {
    this._baseAlpha = alpha;
    this._alpha = alpha;
    this._outlierThreshold = outlierThreshold;
    this._historySize = historySize;
    this._warmupFrames = warmupFrames;

    this._smoothed = null;
    this._history = [];
    this._frameCount = 0;
    this._consecutiveRejects = 0;
  }

  process(x, y) {
    if (x == null || y == null || isNaN(x) || isNaN(y)) return null;

    const raw = { x, y };

    if (this._smoothed) {
      const dist = Math.hypot(raw.x - this._smoothed.x, raw.y - this._smoothed.y);

      if (dist > this._outlierThreshold) {
        this._consecutiveRejects++;
        if (this._consecutiveRejects >= 3) {
          this._consecutiveRejects = 0;
          this._smoothed = raw;
          this._history = [raw];
          this._frameCount = 1;
          return raw;
        }
        return null;
      }
    }

    this._consecutiveRejects = 0;

    if (!this._smoothed) {
      this._smoothed = raw;
      this._history = [raw];
      this._frameCount = 1;
      return raw;
    }

    this._frameCount++;

    this._history.push(raw);
    if (this._history.length > this._historySize) {
      this._history.shift();
    }

    const velocity = this._history.length >= 2
      ? Math.hypot(
          raw.x - this._history[this._history.length - 2].x,
          raw.y - this._history[this._history.length - 2].y
        )
      : 0;

    const velocityFactor = Math.min(velocity / 150, 1);
    const adaptiveAlpha = this._baseAlpha + (1 - this._baseAlpha) * velocityFactor * 0.5;

    const warmupAlpha = this._frameCount <= this._warmupFrames
      ? 1 - (1 - adaptiveAlpha) * (this._frameCount / this._warmupFrames)
      : adaptiveAlpha;

    this._alpha = warmupAlpha;

    this._smoothed = {
      x: this._alpha * raw.x + (1 - this._alpha) * this._smoothed.x,
      y: this._alpha * raw.y + (1 - this._alpha) * this._smoothed.y,
    };

    return { x: this._smoothed.x, y: this._smoothed.y };
  }

  reset() {
    this._smoothed = null;
    this._history = [];
    this._frameCount = 0;
    this._consecutiveRejects = 0;
    this._alpha = this._baseAlpha;
  }

  setAlpha(alpha) {
    this._baseAlpha = Math.max(0.05, Math.min(1, alpha));
  }

  getAlpha() {
    return this._baseAlpha;
  }
}
