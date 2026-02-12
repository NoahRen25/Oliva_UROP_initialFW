export function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function standardDeviation(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squaredDiffs = arr.map((v) => (v - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / arr.length);
}

export function scoreDistribution(arr) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  arr.forEach((v) => {
    const key = Math.round(v);
    if (key >= 1 && key <= 5) dist[key]++;
  });
  return dist;
}

export function detectOutliers(sessions, mode = "individual") {
  return sessions.map((session) => {
    const reasons = [];

    if (mode === "individual" || mode === "group") {
      const scores = session.scores || [];
      const mainScores = scores.filter(
        (s) => s.imageId !== 0 && s.imageId !== "b1"
      );

      if (mainScores.length >= 5) {
        // Check average time per image < 1.5s
        const times = mainScores.map((s) => parseFloat(s.timeSpent) || 0);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        if (avgTime < 1.5) {
          reasons.push(
            `Avg time per image very fast (${avgTime.toFixed(1)}s < 1.5s)`
          );
        }

        // Check total session time < 5s for 5+ images
        const totalTime = times.reduce((a, b) => a + b, 0);
        if (totalTime < 5) {
          reasons.push(
            `Total session time very short (${totalTime.toFixed(1)}s for ${mainScores.length} images)`
          );
        }

        // Check all ratings identical
        const scoreValues = mainScores.map((s) => s.score);
        if (scoreValues.length > 1 && scoreValues.every((v) => v === scoreValues[0])) {
          reasons.push(`All ratings identical (${scoreValues[0]})`);
        }
      }
    }

    if (mode === "pairwise" || mode === "pressure-cooker") {
      const choices = session.choices || [];
      if (choices.length >= 5) {
        const times = choices.map((c) => parseFloat(c.timeSpent) || 0);
        const avgTime =
          times.reduce((a, b) => a + b, 0) / (times.length || 1);
        if (avgTime < 1.5) {
          reasons.push(
            `Avg time per pair very fast (${avgTime.toFixed(1)}s < 1.5s)`
          );
        }
      }
    }

    return { ...session, outlierReasons: reasons };
  });
}
