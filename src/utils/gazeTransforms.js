/**
 * Pure data transformation functions for gaze session analytics.
 * All functions take gaze session data (from gazeStorage.getGazeSessions())
 * and return chart-ready data structures.
 *
 * Gaze session shape:
 * {
 *   sessionId, mode, username, startTime, endTime,
 *   images: { [imageId]: { firstGazeTime, totalGazeTime, gazeEntries, gazeExits, coordinates } }
 * }
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all image entries from a session as [imageId, imageData] pairs. */
function imageEntries(session) {
  if (!session || !session.images) return [];
  return Object.entries(session.images);
}

/** Clamp a value between lo and hi (inclusive). */
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// ---------------------------------------------------------------------------
// 1. Gaze Overview Metrics
// ---------------------------------------------------------------------------

export function buildGazeOverview(gazeSessions) {
  const sessions = gazeSessions || [];

  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      avgDwellTime: 0,
      avgGazeEntries: 0,
      uniqueImages: 0,
      byMode: [],
    };
  }

  // Collect all images across all sessions for global stats
  const globalImageSet = new Set();
  let globalDwellSum = 0;
  let globalEntriesSum = 0;
  let globalImageCount = 0;

  // Group sessions by mode
  const modeMap = {}; // mode -> { sessions: [], dwellSum, entriesSum, imageCount }

  for (const session of sessions) {
    const mode = session.mode || "unknown";
    if (!modeMap[mode]) {
      modeMap[mode] = { sessions: [], dwellSum: 0, entriesSum: 0, imageCount: 0 };
    }
    modeMap[mode].sessions.push(session);

    for (const [imageId, imgData] of imageEntries(session)) {
      globalImageSet.add(imageId);

      const dwell = imgData.totalGazeTime || 0;
      const entries = imgData.gazeEntries || 0;

      globalDwellSum += dwell;
      globalEntriesSum += entries;
      globalImageCount++;

      modeMap[mode].dwellSum += dwell;
      modeMap[mode].entriesSum += entries;
      modeMap[mode].imageCount++;
    }
  }

  const avgDwellTime = globalImageCount > 0 ? globalDwellSum / globalImageCount : 0;
  const avgGazeEntries = globalImageCount > 0 ? globalEntriesSum / globalImageCount : 0;

  const byMode = Object.entries(modeMap).map(([mode, data]) => ({
    mode,
    sessions: data.sessions.length,
    avgDwellTime: data.imageCount > 0 ? data.dwellSum / data.imageCount : 0,
    avgEntries: data.imageCount > 0 ? data.entriesSum / data.imageCount : 0,
  }));

  return {
    totalSessions: sessions.length,
    avgDwellTime,
    avgGazeEntries,
    uniqueImages: globalImageSet.size,
    byMode,
  };
}

// ---------------------------------------------------------------------------
// 2. Dwell Chart
// ---------------------------------------------------------------------------

export function buildDwellChart(sessionOrSessions) {
  if (!sessionOrSessions) return [];

  const sessions = Array.isArray(sessionOrSessions)
    ? sessionOrSessions
    : [sessionOrSessions];

  if (sessions.length === 0) return [];

  // Aggregate by imageId across all provided sessions
  const imageMap = {}; // imageId -> { dwellTime, entries, exits, firstGazeTime }

  for (const session of sessions) {
    for (const [imageId, imgData] of imageEntries(session)) {
      if (!imageMap[imageId]) {
        imageMap[imageId] = {
          imageId,
          dwellTime: 0,
          entries: 0,
          exits: 0,
          firstGazeTime: Infinity,
        };
      }
      imageMap[imageId].dwellTime += (imgData.totalGazeTime || 0) / 1000;
      imageMap[imageId].entries += imgData.gazeEntries || 0;
      imageMap[imageId].exits += imgData.gazeExits || 0;

      const fgt = imgData.firstGazeTime;
      if (fgt != null && fgt < imageMap[imageId].firstGazeTime) {
        imageMap[imageId].firstGazeTime = fgt;
      }
    }
  }

  return Object.values(imageMap)
    .map((img) => ({
      ...img,
      // If no firstGazeTime was ever set, default to 0
      firstGazeTime: img.firstGazeTime === Infinity ? 0 : img.firstGazeTime,
    }))
    .sort((a, b) => b.dwellTime - a.dwellTime);
}

// ---------------------------------------------------------------------------
// 3. Gaze Timeline
// ---------------------------------------------------------------------------

export function buildGazeTimeline(gazeSession) {
  if (!gazeSession || !gazeSession.images) return [];

  // Collect all coordinates tagged with their imageId
  const allCoords = [];
  for (const [imageId, imgData] of imageEntries(gazeSession)) {
    if (!imgData.coordinates || imgData.coordinates.length === 0) continue;
    for (const coord of imgData.coordinates) {
      allCoords.push({ imageId, t: coord.t });
    }
  }

  if (allCoords.length === 0) return [];

  // Sort by time
  allCoords.sort((a, b) => a.t - b.t);

  const maxT = allCoords[allCoords.length - 1].t;
  const bucketSize = 100; // ms
  const bucketCount = Math.floor(maxT / bucketSize) + 1;

  const timeline = [];
  let coordIdx = 0;

  for (let bucket = 0; bucket < bucketCount; bucket++) {
    const bucketStart = bucket * bucketSize;
    const bucketEnd = bucketStart + bucketSize;

    // Count coordinates per imageId in this bucket
    const counts = {};
    while (coordIdx < allCoords.length && allCoords[coordIdx].t < bucketEnd) {
      const c = allCoords[coordIdx];
      if (c.t >= bucketStart) {
        counts[c.imageId] = (counts[c.imageId] || 0) + 1;
      }
      coordIdx++;
    }
    // Reset index for overlapping boundary — but since we move forward only,
    // rewind to where next bucket starts
    // Actually, coordinates are consumed per-bucket with no overlap, so we need
    // to rewind coordIdx to catch coords exactly at bucketEnd for next bucket.
    // Re-scan: we want [bucketStart, bucketEnd) so coords at bucketEnd belong to next bucket.
    // The while loop already handles this correctly (< bucketEnd).

    const entries = Object.entries(counts);
    if (entries.length === 0) continue;

    // Pick imageId with most coordinates in this bucket
    let bestImage = entries[0][0];
    let bestCount = entries[0][1];
    for (let i = 1; i < entries.length; i++) {
      if (entries[i][1] > bestCount) {
        bestImage = entries[i][0];
        bestCount = entries[i][1];
      }
    }

    timeline.push({
      time: bucketStart / 1000,
      imageId: bestImage,
    });
  }

  return timeline;
}

// ---------------------------------------------------------------------------
// 4. Heatmap Data
// ---------------------------------------------------------------------------

export function buildHeatmapData(gazeSession, imageId) {
  const emptyResult = { grid: Array.from({ length: 50 }, () => new Array(50).fill(0)), maxDensity: 0 };

  if (!gazeSession || !gazeSession.images || !gazeSession.images[imageId]) {
    return emptyResult;
  }

  const imgData = gazeSession.images[imageId];
  const coords = imgData.coordinates;
  if (!coords || coords.length === 0) return emptyResult;

  const size = 50;
  const raw = Array.from({ length: size }, () => new Array(size).fill(0));

  // Populate raw grid
  for (const { x, y } of coords) {
    const col = clamp(Math.floor(x * 49), 0, 49);
    const row = clamp(Math.floor(y * 49), 0, 49);
    raw[row][col]++;
  }

  // Apply Gaussian blur
  const sigma = 1.5;
  const radius = 3;
  const blurred = Array.from({ length: size }, () => new Array(size).fill(0));

  // Precompute Gaussian kernel weights
  const kernel = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const weight = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
      kernel.push({ dx, dy, weight });
    }
  }

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (raw[row][col] === 0) continue;
      const value = raw[row][col];
      for (const { dx, dy, weight } of kernel) {
        const nr = row + dy;
        const nc = col + dx;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
          blurred[nr][nc] += value * weight;
        }
      }
    }
  }

  // Find max density
  let maxDensity = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (blurred[row][col] > maxDensity) {
        maxDensity = blurred[row][col];
      }
    }
  }

  return { grid: blurred, maxDensity };
}

// ---------------------------------------------------------------------------
// 5. Flatten for Export
// ---------------------------------------------------------------------------

export function flattenForExport(gazeSessions, level) {
  const sessions = gazeSessions || [];

  if (level === "session") {
    return sessions.map((s) => {
      const imgs = imageEntries(s);
      const totalDwellTimeMs = imgs.reduce(
        (sum, [, imgData]) => sum + (imgData.totalGazeTime || 0),
        0
      );
      return {
        sessionId: s.sessionId,
        mode: s.mode,
        username: s.username,
        startTime: s.startTime,
        endTime: s.endTime,
        totalImages: imgs.length,
        totalDwellTimeMs,
      };
    });
  }

  if (level === "image") {
    const rows = [];
    for (const s of sessions) {
      for (const [imageId, imgData] of imageEntries(s)) {
        rows.push({
          sessionId: s.sessionId,
          mode: s.mode,
          username: s.username,
          imageId,
          dwellTimeMs: imgData.totalGazeTime || 0,
          gazeEntries: imgData.gazeEntries || 0,
          gazeExits: imgData.gazeExits || 0,
          firstGazeTimeMs: imgData.firstGazeTime || 0,
          coordinateCount: imgData.coordinates ? imgData.coordinates.length : 0,
        });
      }
    }
    return rows;
  }

  if (level === "coordinates") {
    const rows = [];
    for (const s of sessions) {
      for (const [imageId, imgData] of imageEntries(s)) {
        if (!imgData.coordinates) continue;
        for (const coord of imgData.coordinates) {
          rows.push({
            sessionId: s.sessionId,
            imageId,
            x: coord.x,
            y: coord.y,
            t: coord.t,
          });
        }
      }
    }
    return rows;
  }

  // Unknown level — return empty array
  return [];
}
