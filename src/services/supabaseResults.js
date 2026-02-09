/**
 * Supabase read/write layer for experiment results.
 * Every function is a no-op that returns gracefully when supabase is null
 * (i.e. env vars are missing), so the app still works offline via localStorage.
 */

import { supabase } from "../supabaseClient";

// =====================
// HELPERS
// =====================

const isConfigured = () => !!supabase;

// =====================
// SESSIONS (parent table)
// =====================

export async function insertSession({ id, type, username, timestamp, meta = {} }) {
  if (!isConfigured()) return null;
  const { error } = await supabase
    .from("sessions")
    .insert({ id, type, username, timestamp, meta });
  if (error) console.error("insertSession error:", error.message);
  return error ? null : id;
}

export async function deleteSession(id) {
  if (!isConfigured()) return;
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) console.warn("deleteSession: requires auth —", error.message);
}

export async function deleteSessionsByType(type) {
  if (!isConfigured()) return;
  const { error } = await supabase.from("sessions").delete().eq("type", type);
  if (error) console.warn("deleteSessionsByType: requires auth —", error.message);
}

// =====================
// RATING SCORES
// =====================

export async function insertRatingScores(sessionId, scores) {
  if (!isConfigured() || !scores?.length) return;
  const rows = scores.map((s) => ({
    session_id: sessionId,
    image_id: s.id ?? s.imageId ?? null,
    image_src: s.src ?? s.imageSrc ?? null,
    filename: s.filename ?? null,
    prompt: s.prompt ?? null,
    category: s.category ?? null,
    score: s.score ?? s.rating ?? null,
    time_spent: s.timeSpent ?? null,
    interaction_count: s.interactionCount ?? 0,
    extra: s.extra ?? {},
  }));
  const { error } = await supabase.from("rating_scores").insert(rows);
  if (error) console.error("insertRatingScores error:", error.message);
}

// =====================
// PAIRWISE CHOICES
// =====================

export async function insertPairwiseChoices(sessionId, choices) {
  if (!isConfigured() || !choices?.length) return;
  const rows = choices.map((c) => ({
    session_id: sessionId,
    pair_id: c.pairId ?? c.id ?? null,
    winner_side: c.winnerSide ?? null,
    winner_name: c.winnerName ?? null,
    loser_name: c.loserName ?? null,
    response_time: c.responseTime ?? null,
    extra: c.extra ?? {},
  }));
  const { error } = await supabase.from("pairwise_choices").insert(rows);
  if (error) console.error("insertPairwiseChoices error:", error.message);
}

// =====================
// RANKED RESULTS
// =====================

export async function insertRankedResults(sessionId, rankings) {
  if (!isConfigured() || !rankings?.length) return;
  const rows = rankings.map((r) => ({
    session_id: sessionId,
    group_id: r.groupId ?? null,
    prompt: r.prompt ?? null,
    rank: r.rank ?? null,
    image_id: r.imageId ?? r.id ?? null,
    image_src: r.src ?? null,
    filename: r.filename ?? null,
    folder_id: r.folderId ?? null,
    extra: r.extra ?? {},
  }));
  const { error } = await supabase.from("ranked_results").insert(rows);
  if (error) console.error("insertRankedResults error:", error.message);
}

// =====================
// BEST-WORST TRIALS
// =====================

export async function insertBestWorstTrials(sessionId, trials) {
  if (!isConfigured() || !trials?.length) return;
  const rows = trials.map((t) => ({
    session_id: sessionId,
    trial_id: t.trialId ?? null,
    prompt: t.prompt ?? null,
    best_id: t.bestId ?? null,
    best_name: t.bestName ?? null,
    worst_id: t.worstId ?? null,
    worst_name: t.worstName ?? null,
    response_time: t.responseTime ?? null,
    extra: t.extra ?? {},
  }));
  const { error } = await supabase.from("best_worst_trials").insert(rows);
  if (error) console.error("insertBestWorstTrials error:", error.message);
}

// =====================
// TRANSCRIPTS
// =====================

export async function insertTranscript({ id, text, duration, timestamp, length }) {
  if (!isConfigured()) return;
  const { error } = await supabase
    .from("transcripts")
    .insert({ id, text, duration, timestamp, length });
  if (error) console.error("insertTranscript error:", error.message);
}

export async function deleteTranscript(id) {
  if (!isConfigured()) return;
  const { error } = await supabase.from("transcripts").delete().eq("id", id);
  if (error) console.warn("deleteTranscript: requires auth —", error.message);
}

export async function deleteAllTranscripts() {
  if (!isConfigured()) return;
  const { error } = await supabase.from("transcripts").delete().neq("id", 0);
  if (error) console.warn("deleteAllTranscripts: requires auth —", error.message);
}

// =====================
// FETCH FUNCTIONS
// =====================

export async function fetchSessionsByType(type) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("type", type)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("fetchSessionsByType error:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchRatingScores(sessionId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("rating_scores")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });
  if (error) {
    console.error("fetchRatingScores error:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchPairwiseChoices(sessionId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("pairwise_choices")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });
  if (error) {
    console.error("fetchPairwiseChoices error:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchRankedResults(sessionId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("ranked_results")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });
  if (error) {
    console.error("fetchRankedResults error:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchBestWorstTrials(sessionId) {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("best_worst_trials")
    .select("*")
    .eq("session_id", sessionId)
    .order("id", { ascending: true });
  if (error) {
    console.error("fetchBestWorstTrials error:", error.message);
    return [];
  }
  return data || [];
}

export async function fetchTranscripts() {
  if (!isConfigured()) return [];
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error("fetchTranscripts error:", error.message);
    return [];
  }
  return data || [];
}

// =====================
// COMPOSITE FETCHERS
// =====================

/**
 * Fetch all sessions of a type and hydrate each with its child rows.
 * Returns the same shape the app expects from localStorage.
 */
export async function fetchSessionsWithScores(type) {
  if (!isConfigured()) return [];
  const sessions = await fetchSessionsByType(type);
  return Promise.all(
    sessions.map(async (s) => {
      const dbScores = await fetchRatingScores(s.id);
      const scores = dbScores.map((r) => ({
        id: r.image_id,
        src: r.image_src,
        filename: r.filename,
        prompt: r.prompt,
        category: r.category,
        score: r.score,
        rating: r.score,
        timeSpent: r.time_spent,
        interactionCount: r.interaction_count,
        ...r.extra,
      }));
      return {
        id: s.id,
        username: s.username,
        scores,
        timestamp: s.timestamp,
        ...(s.meta || {}),
      };
    })
  );
}

export async function fetchSessionsWithChoices(type) {
  if (!isConfigured()) return [];
  const sessions = await fetchSessionsByType(type);
  return Promise.all(
    sessions.map(async (s) => {
      const dbChoices = await fetchPairwiseChoices(s.id);
      const choices = dbChoices.map((c) => ({
        pairId: c.pair_id,
        id: c.pair_id,
        winnerSide: c.winner_side,
        winnerName: c.winner_name,
        loserName: c.loser_name,
        responseTime: c.response_time,
        ...c.extra,
      }));
      return {
        id: s.id,
        username: s.username,
        choices,
        timestamp: s.timestamp,
        ...(s.meta || {}),
      };
    })
  );
}

export async function fetchSessionsWithRankings() {
  if (!isConfigured()) return [];
  const sessions = await fetchSessionsByType("ranked");
  return Promise.all(
    sessions.map(async (s) => {
      const dbRanks = await fetchRankedResults(s.id);
      const rankings = dbRanks.map((r) => ({
        groupId: r.group_id,
        prompt: r.prompt,
        rank: r.rank,
        imageId: r.image_id,
        id: r.image_id,
        src: r.image_src,
        filename: r.filename,
        folderId: r.folder_id,
        ...r.extra,
      }));
      return {
        id: s.id,
        username: s.username,
        rankings,
        timestamp: s.timestamp,
        ...(s.meta || {}),
      };
    })
  );
}

export async function fetchSessionsWithBestWorst() {
  if (!isConfigured()) return [];
  const sessions = await fetchSessionsByType("best_worst");
  return Promise.all(
    sessions.map(async (s) => {
      const dbTrials = await fetchBestWorstTrials(s.id);
      const trials = dbTrials.map((t) => ({
        trialId: t.trial_id,
        prompt: t.prompt,
        bestId: t.best_id,
        bestName: t.best_name,
        worstId: t.worst_id,
        worstName: t.worst_name,
        responseTime: t.response_time,
        ...t.extra,
      }));
      return {
        id: s.id,
        username: s.username,
        trials,
        timestamp: s.timestamp,
        ...(s.meta || {}),
      };
    })
  );
}
