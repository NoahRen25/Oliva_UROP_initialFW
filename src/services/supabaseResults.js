import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Sessions ───────────────────────────────────────────────────

export async function insertSession({ id, type, username, timestamp, meta }) {
  const { error } = await supabase
    .from("sessions")
    .upsert({ id, type, username, timestamp, meta }, { onConflict: "id" });
  if (error) console.error("insertSession:", error.message);
}

export async function deleteSession(id) {
  const { error } = await supabase.from("sessions").delete().eq("id", id);
  if (error) console.error("deleteSession:", error.message);
}

export async function deleteSessionsByType(type) {
  const { error } = await supabase.from("sessions").delete().eq("type", type);
  if (error) console.error("deleteSessionsByType:", error.message);
}

export async function deleteAllSessions() {
  const { error } = await supabase.from("sessions").delete().neq("id", 0);
  if (error) console.error("deleteAllSessions:", error.message);
}

// ─── Rating Scores ──────────────────────────────────────────────

export async function insertRatingScores(sessionId, scores) {
  if (!scores?.length) return;
  const rows = scores.map((s) => ({
    session_id: sessionId,
    image_id: s.imageId ?? s.id,
    image_name: s.imageName ?? s.filename,
    filename: s.filename ?? s.imageName,
    prompt: s.prompt,
    score: s.score ?? s.rating,
    rating: s.rating ?? s.score,
    time_spent: s.timeSpent,
    interaction_count: s.interactionCount ?? 0,
    click_order: s.clickOrder,
    memorability_score: s.memorabilityScore,
    actual_mem_score: s.actualMemScore,
    src: s.src || s.imageSrc,
  }));
  const { error } = await supabase.from("rating_scores").insert(rows);
  if (error) console.error("insertRatingScores:", error.message);
}

// ─── Pairwise Choices ───────────────────────────────────────────

export async function insertPairwiseChoices(sessionId, choices) {
  if (!choices?.length) return;
  const rows = choices.map((c) => ({
    session_id: sessionId,
    pair_id: c.pairId,
    winner_name: c.winnerName,
    loser_name: c.loserName,
    winner_src: c.winnerSrc,
    loser_src: c.loserSrc,
    reaction_time: c.reactionTime,
    timed_out: c.timedOut ?? false,
  }));
  const { error } = await supabase.from("pairwise_choices").insert(rows);
  if (error) console.error("insertPairwiseChoices:", error.message);
}

// ─── Ranked Results ─────────────────────────────────────────────

export async function insertRankedResults(sessionId, rankings) {
  if (!rankings?.length) return;
  const rows = rankings.map((r) => ({
    session_id: sessionId,
    image_id: r.imageId,
    image_name: r.imageName,
    src: r.src,
    rank: r.rank,
    group_id: r.groupId,
  }));
  const { error } = await supabase.from("ranked_results").insert(rows);
  if (error) console.error("insertRankedResults:", error.message);
}

// ─── Best-Worst Trials ─────────────────────────────────────────

export async function insertBestWorstTrials(sessionId, trials) {
  if (!trials?.length) return;
  const rows = trials.map((t, i) => ({
    session_id: sessionId,
    trial_index: t.trialIndex ?? i,
    best_name: t.bestName,
    worst_name: t.worstName,
    best_src: t.bestSrc,
    worst_src: t.worstSrc,
    options: t.options || [],
    reaction_time: t.reactionTime,
  }));
  const { error } = await supabase.from("best_worst_trials").insert(rows);
  if (error) console.error("insertBestWorstTrials:", error.message);
}

// ─── Transcripts ────────────────────────────────────────────────

export async function insertTranscript(entry) {
  const { error } = await supabase
    .from("transcripts")
    .upsert(
      { id: entry.id, text: entry.text, duration: entry.duration, timestamp: entry.timestamp, length: entry.length },
      { onConflict: "id" }
    );
  if (error) console.error("insertTranscript:", error.message);
}

export async function deleteTranscript(id) {
  const { error } = await supabase.from("transcripts").delete().eq("id", id);
  if (error) console.error("deleteTranscript:", error.message);
}

export async function deleteAllTranscripts() {
  const { error } = await supabase.from("transcripts").delete().neq("id", 0);
  if (error) console.error("deleteAllTranscripts:", error.message);
}

export async function fetchTranscripts() {
  const { data, error } = await supabase
    .from("transcripts")
    .select("*")
    .order("id", { ascending: false });
  if (error) {
    console.error("fetchTranscripts:", error.message);
    return [];
  }
  return data || [];
}

// ─── Fetch helpers (sessions + child data) ──────────────────────

function shapeScores(raw) {
  return {
    imageId: raw.image_id,
    imageName: raw.image_name || raw.filename,
    filename: raw.filename || raw.image_name,
    prompt: raw.prompt,
    score: raw.score ?? raw.rating,
    rating: raw.rating ?? raw.score,
    timeSpent: raw.time_spent,
    interactionCount: raw.interaction_count,
    clickOrder: raw.click_order,
    memorabilityScore: raw.memorability_score,
    actualMemScore: raw.actual_mem_score,
    src: raw.src,
    id: raw.image_id,
  };
}

function shapeChoice(raw) {
  return {
    pairId: raw.pair_id,
    winnerName: raw.winner_name,
    loserName: raw.loser_name,
    winnerSrc: raw.winner_src,
    loserSrc: raw.loser_src,
    reactionTime: raw.reaction_time,
    timedOut: raw.timed_out,
  };
}

function shapeRanking(raw) {
  return {
    imageId: raw.image_id,
    imageName: raw.image_name,
    src: raw.src,
    rank: raw.rank,
    groupId: raw.group_id,
  };
}

function shapeBestWorst(raw) {
  return {
    trialIndex: raw.trial_index,
    bestName: raw.best_name,
    worstName: raw.worst_name,
    bestSrc: raw.best_src,
    worstSrc: raw.worst_src,
    options: raw.options,
    reactionTime: raw.reaction_time,
  };
}

export async function fetchSessionsWithScores(type) {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("type", type)
    .order("timestamp", { ascending: true });
  if (error || !sessions?.length) return [];

  const ids = sessions.map((s) => s.id);
  const { data: scores } = await supabase
    .from("rating_scores")
    .select("*")
    .in("session_id", ids);

  const scoreMap = {};
  (scores || []).forEach((s) => {
    if (!scoreMap[s.session_id]) scoreMap[s.session_id] = [];
    scoreMap[s.session_id].push(shapeScores(s));
  });

  return sessions.map((s) => ({
    id: s.id,
    username: s.username,
    timestamp: s.timestamp,
    meta: s.meta,
    layoutId: s.meta?.layoutId,
    prompt: s.meta?.prompt,
    pageTranscripts: s.meta?.pageTranscripts || {},
    pageAudioUrls: s.meta?.pageAudioUrls || {},
    scores: scoreMap[s.id] || [],
  }));
}

export async function fetchSessionsWithChoices(type) {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("type", type)
    .order("timestamp", { ascending: true });
  if (error || !sessions?.length) return [];

  const ids = sessions.map((s) => s.id);
  const { data: choices } = await supabase
    .from("pairwise_choices")
    .select("*")
    .in("session_id", ids);

  const choiceMap = {};
  (choices || []).forEach((c) => {
    if (!choiceMap[c.session_id]) choiceMap[c.session_id] = [];
    choiceMap[c.session_id].push(shapeChoice(c));
  });

  return sessions.map((s) => ({
    id: s.id,
    username: s.username,
    timestamp: s.timestamp,
    meta: s.meta,
    pageTranscripts: s.meta?.pageTranscripts || {},
    pageAudioUrls: s.meta?.pageAudioUrls || {},
    choices: choiceMap[s.id] || [],
  }));
}

export async function fetchSessionsWithRankings() {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("type", "ranked")
    .order("timestamp", { ascending: true });
  if (error || !sessions?.length) return [];

  const ids = sessions.map((s) => s.id);
  const { data: rankings } = await supabase
    .from("ranked_results")
    .select("*")
    .in("session_id", ids);

  const rankMap = {};
  (rankings || []).forEach((r) => {
    if (!rankMap[r.session_id]) rankMap[r.session_id] = [];
    rankMap[r.session_id].push(shapeRanking(r));
  });

  return sessions.map((s) => ({
    id: s.id,
    username: s.username,
    timestamp: s.timestamp,
    meta: s.meta,
    pageTranscripts: s.meta?.pageTranscripts || {},
    pageAudioUrls: s.meta?.pageAudioUrls || {},
    rankings: rankMap[s.id] || [],
  }));
}

export async function fetchSessionsWithBestWorst() {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("type", "best_worst")
    .order("timestamp", { ascending: true });
  if (error || !sessions?.length) return [];

  const ids = sessions.map((s) => s.id);
  const { data: trials } = await supabase
    .from("best_worst_trials")
    .select("*")
    .in("session_id", ids);

  const trialMap = {};
  (trials || []).forEach((t) => {
    if (!trialMap[t.session_id]) trialMap[t.session_id] = [];
    trialMap[t.session_id].push(shapeBestWorst(t));
  });

  return sessions.map((s) => ({
    id: s.id,
    username: s.username,
    timestamp: s.timestamp,
    meta: s.meta,
    pageTranscripts: s.meta?.pageTranscripts || {},
    pageAudioUrls: s.meta?.pageAudioUrls || {},
    trials: trialMap[s.id] || [],
  }));
}