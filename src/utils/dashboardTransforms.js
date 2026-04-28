/**
 * Pure data transformation functions for the Analytics Dashboard.
 * All functions take the session arrays from useResults() and return
 * chart-ready data structures.
 */

import { calculateStats, detectOutliers } from "./statsUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTimestamp(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

function toDateKey(d) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function countRatings(session) {
  if (session.scores) return session.scores.length;
  if (session.choices) return session.choices.length;
  if (session.rankings) return session.rankings.length;
  if (session.trials) return session.trials.length;
  if (session.selections) return session.selections.length;
  return 0;
}

// ---------------------------------------------------------------------------
// 1. Overview Metrics
// ---------------------------------------------------------------------------

export function computeOverviewMetrics({
  individualSessions = [],
  groupSessions = [],
  fixedSessions = [],
  pairwiseSessions = [],
  rankedSessions = [],
  bestWorstSessions = [],
  selectionSessions = [],
}) {
  const byMode = {
    individual: individualSessions.length,
    group: groupSessions.length,
    fixed: fixedSessions.length,
    pairwise: pairwiseSessions.length,
    ranked: rankedSessions.length,
    bestWorst: bestWorstSessions.length,
    selection: selectionSessions.length,
  };

  const totalSessions = Object.values(byMode).reduce((a, b) => a + b, 0);

  const allSessions = [
    ...individualSessions,
    ...groupSessions,
    ...fixedSessions,
    ...pairwiseSessions,
    ...rankedSessions,
    ...bestWorstSessions,
    ...selectionSessions,
  ];

  const totalRatings = allSessions.reduce((sum, s) => sum + countRatings(s), 0);

  const userSet = new Set(allSessions.map((s) => s.username).filter(Boolean));
  const uniqueUsers = userSet.size;

  const activeModes = Object.values(byMode).filter((n) => n > 0).length;
  const avgRatingsPerSession = totalSessions > 0
    ? (totalRatings / totalSessions).toFixed(1)
    : "0";

  return {
    totalSessions,
    totalRatings,
    uniqueUsers,
    activeModes,
    avgRatingsPerSession,
    sessionsByMode: byMode,
  };
}

// ---------------------------------------------------------------------------
// 2. Sessions Timeline
// ---------------------------------------------------------------------------

export function buildSessionTimeline({
  individualSessions = [],
  groupSessions = [],
  fixedSessions = [],
  pairwiseSessions = [],
  rankedSessions = [],
  bestWorstSessions = [],
  selectionSessions = [],
}) {
  const modeMap = {
    individual: individualSessions,
    group: groupSessions,
    fixed: fixedSessions,
    pairwise: pairwiseSessions,
    ranked: rankedSessions,
    bestWorst: bestWorstSessions,
    selection: selectionSessions,
  };

  // Flatten into { date, mode } entries
  const entries = [];
  for (const [mode, sessions] of Object.entries(modeMap)) {
    for (const s of sessions) {
      const d = parseTimestamp(s.timestamp);
      if (d) entries.push({ date: toDateKey(d), mode });
    }
  }

  if (entries.length === 0) return [];

  // Group by date
  const dateMap = {};
  for (const { date, mode } of entries) {
    if (!dateMap[date]) {
      dateMap[date] = { date, individual: 0, group: 0, fixed: 0, pairwise: 0, ranked: 0, bestWorst: 0, selection: 0, total: 0 };
    }
    dateMap[date][mode]++;
    dateMap[date].total++;
  }

  // Sort by date and fill gaps
  const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length <= 1) return sorted;

  const filled = [];
  const start = new Date(sorted[0].date);
  const end = new Date(sorted[sorted.length - 1].date);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d);
    filled.push(
      dateMap[key] || { date: key, individual: 0, group: 0, fixed: 0, pairwise: 0, ranked: 0, bestWorst: 0, selection: 0, total: 0 }
    );
  }

  return filled;
}

// ---------------------------------------------------------------------------
// 3. Mode Breakdown
// ---------------------------------------------------------------------------

export function buildModeBreakdown({
  individualSessions = [],
  groupSessions = [],
  fixedSessions = [],
  pairwiseSessions = [],
  rankedSessions = [],
  bestWorstSessions = [],
  selectionSessions = [],
}) {
  const modes = [
    { key: "individual", label: "Individual", sessions: individualSessions, hasScores: true },
    { key: "group", label: "Group", sessions: groupSessions, hasScores: true },
    { key: "fixed", label: "Fixed", sessions: fixedSessions, hasScores: true },
    { key: "pairwise", label: "Pairwise", sessions: pairwiseSessions, hasScores: false },
    { key: "ranked", label: "Ranked", sessions: rankedSessions, hasScores: false },
    { key: "bestWorst", label: "Best-Worst", sessions: bestWorstSessions, hasScores: false },
    { key: "selection", label: "Selection", sessions: selectionSessions, hasScores: false },
  ];

  return modes
    .filter((m) => m.sessions.length > 0)
    .map((m) => {
      const totalRatings = m.sessions.reduce((sum, s) => sum + countRatings(s), 0);

      let meanScore = null;
      let stdDev = null;
      if (m.hasScores) {
        const allScores = m.sessions.flatMap((s) =>
          (s.scores || [])
            .filter((sc) => sc.imageId !== 0 && sc.imageId !== "b1")
            .map((sc) => sc.score ?? sc.rating)
            .filter((v) => v != null && !isNaN(v))
        );
        if (allScores.length > 0) {
          const stats = calculateStats(allScores);
          meanScore = stats.mean;
          stdDev = stats.stdDev;
        }
      }

      const withOutliers = detectOutliers(m.sessions, m.key);
      const outlierCount = withOutliers.filter(
        (s) => s.outlierReasons && s.outlierReasons.length > 0
      ).length;

      return {
        mode: m.label,
        key: m.key,
        sessions: m.sessions.length,
        totalRatings,
        avgRatingsPerSession:
          m.sessions.length > 0
            ? (totalRatings / m.sessions.length).toFixed(1)
            : "0",
        meanScore,
        stdDev,
        outlierCount,
      };
    });
}

// ---------------------------------------------------------------------------
// 4. Image Aggregates
// ---------------------------------------------------------------------------

export function buildImageAggregates({
  individualSessions = [],
  groupSessions = [],
  fixedSessions = [],
}) {
  const imageMap = {}; // key: imageName -> { scores: [], modes: Set }

  const addScores = (sessions, modeName) => {
    for (const s of sessions) {
      for (const sc of s.scores || []) {
        if (sc.imageId === 0 || sc.imageId === "b1") continue;
        const name = sc.filename || sc.imageName || sc.src || `image-${sc.imageId || sc.id}`;
        const score = sc.score ?? sc.rating;
        if (score == null || isNaN(score)) continue;

        if (!imageMap[name]) {
          imageMap[name] = { imageName: name, scores: [], modes: new Set() };
        }
        imageMap[name].scores.push(score);
        imageMap[name].modes.add(modeName);
      }
    }
  };

  addScores(individualSessions, "individual");
  addScores(groupSessions, "group");
  addScores(fixedSessions, "fixed");

  return Object.values(imageMap)
    .map((img) => {
      const stats = calculateStats(img.scores);
      return {
        imageName: img.imageName,
        totalRatings: img.scores.length,
        meanScore: stats.mean,
        medianScore: stats.median,
        stdDev: stats.stdDev,
        histogram: stats.histogram,
        modes: [...img.modes],
      };
    })
    .sort((a, b) => b.totalRatings - a.totalRatings);
}

// ---------------------------------------------------------------------------
// 5. Quality Report
// ---------------------------------------------------------------------------

export function buildQualityReport({
  individualSessions = [],
  groupSessions = [],
  pairwiseSessions = [],
}) {
  const checks = [
    { sessions: individualSessions, mode: "individual" },
    { sessions: groupSessions, mode: "group" },
    { sessions: pairwiseSessions, mode: "pairwise" },
  ];

  let totalSessions = 0;
  let totalOutliers = 0;
  const allReasons = [];
  const outliersByMode = {};

  for (const { sessions, mode } of checks) {
    if (sessions.length === 0) continue;
    totalSessions += sessions.length;
    const flagged = detectOutliers(sessions, mode);
    const outliers = flagged.filter(
      (s) => s.outlierReasons && s.outlierReasons.length > 0
    );
    totalOutliers += outliers.length;
    outliersByMode[mode] = outliers.length;
    for (const s of outliers) {
      allReasons.push(...s.outlierReasons);
    }
  }

  // Count top reasons
  const reasonCounts = {};
  for (const r of allReasons) {
    // Normalize to generic reason (strip specifics)
    const generic = r.replace(/\(.*?\)/g, "").trim();
    reasonCounts[generic] = (reasonCounts[generic] || 0) + 1;
  }

  const topReasons = Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([reason, count]) => ({ reason, count }));

  const outlierRate = totalSessions > 0
    ? ((totalOutliers / totalSessions) * 100).toFixed(1)
    : "0";

  return {
    totalSessions,
    totalOutliers,
    outlierRate,
    outliersByMode,
    topReasons,
  };
}
