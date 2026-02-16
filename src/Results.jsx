import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import {
  insertSession,
  deleteSession,
  deleteSessionsByType,
  insertRatingScores,
  insertPairwiseChoices,
  insertRankedResults,
  insertBestWorstTrials,
  insertTranscript as sbInsertTranscript,
  deleteTranscript as sbDeleteTranscript,
  deleteAllTranscripts as sbDeleteAllTranscripts,
  fetchSessionsWithScores,
  fetchSessionsWithChoices,
  fetchSessionsWithRankings,
  fetchSessionsWithBestWorst,
  fetchTranscripts,
} from "./services/supabaseResults";
import { getSessionMetadata } from "./utils/getSessionMetadata";

const Results = createContext(null);

export const useResults = () => {
  const context = useContext(Results);
  if (!context) {
    return {
      transcripts: [],
      individualSessions: [],
      groupSessions: [],
      pairwiseSessions: [],
      rankedSessions: [],
      bestWorstSessions: [],
      selectionSessions: [],
      fixedSessions: [],
      groupSessionsByLayout: {},
      pressureCookerSessions: [],
      taskPrompt: "",
      isSpeaking: false,
      isAnnouncing: false,
      activePrompt: null,
      setActivePrompt: () => {},
    };
  }
  return context;
};

const defaultPrompt = "Rate how interesting this image would be to a general population";

const readLS = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* quota exceeded */ }
};

export const ResultsProvider = ({ children }) => {
  // --- Common Sessions ---
  const [individualSessions, setIndividualSessions] = useState(() => readLS("app_individual", []));
  const [groupSessions, setGroupSessions] = useState(() => readLS("app_group", []));
  const [transcripts, setTranscripts] = useState(() => readLS("app_transcripts", []));

  // --- File A Specific (Layouts & Fixed) ---
  const [fixedSessions, setFixedSessions] = useState(() => readLS("app_fixed_sessions", []));
  const [groupSessionsByLayout, setGroupSessionsByLayout] = useState(() => readLS("app_group_by_layout", {}));
  const [taskPrompt, setTaskPrompt] = useState(defaultPrompt);

  // --- File B Specific (Modes) ---
  const [pairwiseSessions, setPairwiseSessions] = useState(() => readLS("app_pairwise", []));
  const [rankedSessions, setRankedSessions] = useState(() => readLS("app_ranked", []));
  const [bestWorstSessions, setBestWorstSessions] = useState(() => readLS("app_best_worst", []));
  const [selectionSessions, setSelectionSessions] = useState(() => readLS("app_selection", []));
  const [pressureCookerSessions, setPressureCookerSessions] = useState([]);

  // --- Voice / Audio State ---
  const [isAnnouncing, setIsAnnouncing] = useState(() => readLS("app_announcing", false));
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // --- Active Prompt for ReadPromptButton ---
  const [activePrompt, setActivePrompt] = useState(null);

  // --- Consent State ---
  const [consentGiven, setConsentGiven] = useState(() => readLS("app_consent_given", false));
  const [consentTimestamp, setConsentTimestamp] = useState(() => readLS("app_consent_timestamp", null));

  // --- Engagement / Speed Warning ---
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  const [lastWarnedIndex, setLastWarnedIndex] = useState(0);

  // Write-through to localStorage
  useEffect(() => { writeLS("app_individual", individualSessions); }, [individualSessions]);
  useEffect(() => { writeLS("app_group", groupSessions); }, [groupSessions]);
  useEffect(() => { writeLS("app_transcripts", transcripts); }, [transcripts]);
  useEffect(() => { writeLS("app_fixed_sessions", fixedSessions); }, [fixedSessions]);
  useEffect(() => { writeLS("app_group_by_layout", groupSessionsByLayout); }, [groupSessionsByLayout]);
  useEffect(() => { writeLS("app_pairwise", pairwiseSessions); }, [pairwiseSessions]);
  useEffect(() => { writeLS("app_ranked", rankedSessions); }, [rankedSessions]);
  useEffect(() => { writeLS("app_best_worst", bestWorstSessions); }, [bestWorstSessions]);
  useEffect(() => { writeLS("app_selection", selectionSessions); }, [selectionSessions]);
  useEffect(() => { writeLS("app_announcing", isAnnouncing); }, [isAnnouncing]);
  useEffect(() => { writeLS("app_consent_given", consentGiven); }, [consentGiven]);
  useEffect(() => { writeLS("app_consent_timestamp", consentTimestamp); }, [consentTimestamp]);

  // Supabase hydration (keeping existing code, abbreviated for space)
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      try {
        const [indiv, group, fixed, pairwise, ranked, bestWorst, pressure, trans] =
          await Promise.all([
            fetchSessionsWithScores("individual"),
            fetchSessionsWithScores("group"),
            fetchSessionsWithScores("fixed"),
            fetchSessionsWithChoices("pairwise"),
            fetchSessionsWithRankings(),
            fetchSessionsWithBestWorst(),
            fetchSessionsWithChoices("pressure_cooker"),
            fetchTranscripts(),
          ]);
        if (cancelled) return;
        if (indiv.length) setIndividualSessions(indiv);
        if (group.length) setGroupSessions(group);
        if (fixed.length) setFixedSessions(fixed);
        if (pairwise.length) setPairwiseSessions(pairwise);
        if (ranked.length) setRankedSessions(ranked);
        if (bestWorst.length) setBestWorstSessions(bestWorst);
        if (pressure.length) setPressureCookerSessions(pressure);
        if (trans.length) setTranscripts(trans);

        const layoutSessions = await fetchSessionsWithScores("layout_group");
        if (!cancelled && layoutSessions.length) {
          const byLayout = {};
          for (const s of layoutSessions) {
            const lid = s.layoutId || s.meta?.layoutId;
            if (!lid) continue;
            if (!byLayout[lid]) byLayout[lid] = [];
            byLayout[lid].push(s);
          }
          setGroupSessionsByLayout((prev) => ({ ...prev, ...byLayout }));
        }

        const selSessions = await fetchSessionsWithScores("selection");
        if (!cancelled && selSessions.length) {
          const shaped = selSessions.map((s) => ({
            ...s,
            prompt: s.meta?.prompt || s.prompt || "",
            selections: (s.scores || []).map((sc) => ({
              imageId: sc.id || sc.imageId,
              imageName: sc.filename || sc.imageName,
              imagePrompt: sc.prompt,
              selected: (sc.score || sc.rating) === 1,
            })),
          }));
          setSelectionSessions(shaped);
        }
      } catch (err) {
        console.warn("Supabase hydration failed:", err.message);
      }
    }
    hydrate();
    return () => { cancelled = true; };
  }, []);

  // Engagement logic
  const resetEngagement = () => { setLastWarnedIndex(-2); setShowSpeedWarning(false); };
  const checkEngagement = (timesArray, currentIndex) => {
    if (currentIndex - lastWarnedIndex < 2) return true;
    if (timesArray.length < 2) return true;
    const avg = timesArray.reduce((a, c) => a + c, 0) / timesArray.length;
    if (avg < 4.0) { setShowSpeedWarning(true); setLastWarnedIndex(currentIndex); return false; }
    return true;
  };

  // Speech logic
  const toggleAnnouncing = () => { if (isAnnouncing) window.speechSynthesis.cancel(); setIsAnnouncing((p) => !p); };
  const stopAnnouncing = useCallback(() => { window.speechSynthesis.cancel(); setIsSpeaking(false); }, []);
  const announce = useCallback((text) => {
    if (!isAnnouncing || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.name.includes("Karen") && v.lang.startsWith("en")) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
    if (voice) u.voice = voice;
    u.rate = 1.05;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [isAnnouncing]);

  // Transcripts
  const addTranscript = (text, duration) => {
    if (!text.trim()) return;
    const entry = { id: Date.now(), text: text.trim(), duration, timestamp: new Date().toLocaleString(), length: text.trim().length };
    setTranscripts((p) => [entry, ...p]);
    sbInsertTranscript(entry);
  };
  const delTranscript = (id, timestamp) => { if (window.confirm(`Delete transcript from ${timestamp}?`)) { setTranscripts((p) => p.filter((t) => t.id !== id)); sbDeleteTranscript(id); } };
  const clearTranscripts = () => { if (window.confirm("Delete all transcripts?")) { setTranscripts([]); sbDeleteAllTranscripts(); } };

  // Individual Sessions
  const addIndividualSession = (username, scores) => {
    const session = { id: Date.now(), username, scores, timestamp: new Date().toISOString() };
    setIndividualSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "individual", username, timestamp: session.timestamp });
    insertRatingScores(session.id, scores);
  };
  const deleteIndividualSession = (id, username) => { if (window.confirm(`Delete session by ${username}?`)) { setIndividualSessions((p) => p.filter((s) => s.id != id)); deleteSession(id); } };
  const clearIndividual = () => { if (window.confirm("Delete ALL Individual sessions?")) { setIndividualSessions([]); deleteSessionsByType("individual"); } };

  // Group Sessions
  const addGroupSession = (username, scores) => {
    const session = { id: Date.now(), username, scores, timestamp: new Date().toISOString() };
    setGroupSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "group", username, timestamp: session.timestamp });
    insertRatingScores(session.id, scores);
  };
  const deleteGroupSession = (id, username) => { if (window.confirm(`Delete session by ${username}?`)) { setGroupSessions((p) => p.filter((s) => s.id != id)); deleteSession(id); } };
  const clearGroup = () => { if (window.confirm("Delete ALL Group sessions?")) { setGroupSessions([]); deleteSessionsByType("group"); } };

  // Layout Group Sessions
  const addGroupSessionForLayout = (layoutId, username, scores, meta = {}) => {
    const session = { id: Date.now(), username, scores, meta, layoutId, timestamp: new Date() };
    setGroupSessionsByLayout((p) => { const n = { ...(p || {}) }; n[layoutId] = [...(n[layoutId] || []), session]; return n; });
    insertSession({ id: session.id, type: "layout_group", username, timestamp: new Date().toISOString(), meta: { ...meta, layoutId } });
    insertRatingScores(session.id, scores);
  };
  const getGroupSessions = (layoutId) => (groupSessionsByLayout && groupSessionsByLayout[layoutId]) || [];
  const deleteGroupSessionForLayout = (layoutId, id, username) => { if (window.confirm(`Delete ${layoutId} session by ${username}?`)) { setGroupSessionsByLayout((p) => { const n = { ...(p || {}) }; n[layoutId] = (n[layoutId] || []).filter((s) => s.id != id); return n; }); deleteSession(id); } };
  const clearGroupForLayout = (layoutId) => { if (window.confirm(`Delete ALL sessions for ${layoutId}?`)) { setGroupSessionsByLayout((p) => { const n = { ...(p || {}) }; (n[layoutId] || []).forEach((s) => deleteSession(s.id)); n[layoutId] = []; return n; }); } };
  const clearAllGroupLayouts = () => { if (window.confirm("Delete ALL Group sessions across ALL layouts?")) { Object.values(groupSessionsByLayout || {}).flat().forEach((s) => deleteSession(s.id)); setGroupSessionsByLayout({}); } };

  // Fixed Sessions
  const addFixedSession = (username, scores) => {
    const session = { id: Date.now(), username, scores, timestamp: new Date().toLocaleString() };
    setFixedSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "fixed", username, timestamp: new Date().toISOString() });
    insertRatingScores(session.id, scores);
  };
  const deleteFixedSession = (sessionId) => { if (window.confirm("Delete this session?")) { setFixedSessions((p) => p.filter((s) => s.id !== sessionId)); deleteSession(sessionId); } };
  const clearFixedSessions = () => { if (window.confirm("Clear all fixed results?")) { setFixedSessions([]); deleteSessionsByType("fixed"); } };

  // Pairwise Sessions
  const addPairwiseSession = (username, choices) => {
    const session = { id: Date.now(), username, choices, timestamp: new Date().toISOString() };
    setPairwiseSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "pairwise", username, timestamp: session.timestamp });
    insertPairwiseChoices(session.id, choices);
  };
  const deletePairwiseSession = (id, username) => { if (window.confirm(`Delete session by ${username}?`)) { setPairwiseSessions((p) => p.filter((s) => s.id != id)); deleteSession(id); } };
  const clearPairwise = () => { if (window.confirm("Delete ALL Pairwise sessions?")) { setPairwiseSessions([]); deleteSessionsByType("pairwise"); } };

  // Ranked Sessions
  const addRankedSession = (username, rankings) => {
    const session = { id: Date.now(), username, rankings, timestamp: new Date().toISOString() };
    setRankedSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "ranked", username, timestamp: session.timestamp });
    insertRankedResults(session.id, rankings);
  };
  const deleteRankedSession = (id, username) => { if (window.confirm(`Delete session by ${username}?`)) { setRankedSessions((p) => p.filter((s) => s.id != id)); deleteSession(id); } };
  const clearRanked = () => { if (window.confirm("Delete ALL Ranked sessions?")) { setRankedSessions([]); deleteSessionsByType("ranked"); } };

  // Best-Worst Sessions
  const addBestWorstSession = (username, trials) => {
    const session = { id: Date.now(), username, trials, timestamp: new Date().toISOString() };
    setBestWorstSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "best_worst", username, timestamp: session.timestamp });
    insertBestWorstTrials(session.id, trials);
  };
  const deleteBestWorstSession = (id, username) => { if (window.confirm(`Delete session by ${username}?`)) { setBestWorstSessions((p) => p.filter((s) => s.id != id)); deleteSession(id); } };
  const clearBestWorst = () => { if (window.confirm("Delete ALL Best-Worst sessions?")) { setBestWorstSessions([]); deleteSessionsByType("best_worst"); } };

  // Selection Sessions
  const addSelectionSession = (username, prompt, selections) => {
    const session = { id: Date.now(), username, prompt, selections, timestamp: new Date().toISOString() };
    setSelectionSessions((p) => [...p, session]);
    insertSession({ id: session.id, type: "selection", username, timestamp: session.timestamp, meta: { prompt } });
    insertRatingScores(session.id, selections.map((s) => ({ imageId: s.imageId, imageName: s.imageName, prompt: s.imagePrompt, score: s.selected ? 1 : 0, interactionCount: 0 })));
  };
  const deleteSelectionSession = (id) => { if (window.confirm("Delete this session?")) { setSelectionSessions((p) => p.filter((s) => s.id !== id)); deleteSession(id); } };
  const clearSelection = () => { if (window.confirm("Delete ALL Selection sessions?")) { setSelectionSessions([]); deleteSessionsByType("selection"); } };

  const clearPressureCooker = () => {
    if (window.confirm("Delete ALL Pressure Cooker sessions?")) {
      setPressureCookerSessions([]);
      deleteSessionsByType("pressure_cooker");
    }
  };

  // --- Consent ---
  const acceptConsent = () => {
    setConsentGiven(true);
    setConsentTimestamp(new Date().toISOString());
  };

  const revokeConsent = () => {
    if (window.confirm("Are you sure you want to revoke your consent?")) {
      setConsentGiven(false);
      setConsentTimestamp(null);
    }
  };

  const clearAllData = () => {
    if (window.confirm("This will delete ALL your data and revoke consent. Are you sure?")) {
      setIndividualSessions([]);
      setGroupSessions([]);
      setPairwiseSessions([]);
      setRankedSessions([]);
      setBestWorstSessions([]);
      setPressureCookerSessions([]);
      setSelectionSessions([]);
      setTranscripts([]);
      setFixedSessions([]);
      setGroupSessionsByLayout({});
      setConsentGiven(false);
      setConsentTimestamp(null);
    }
  };

  // --- Pressure Cooker ---
  const addPressureCookerSession = (username, choices, bestStreak) => {
    const pcId = Date.now();
    const meta = getSessionMetadata();
    setPressureCookerSessions((prev) => [
      ...prev,
      { id: pcId, username, choices, bestStreak, timestamp: new Date().toISOString(), metadata: meta },
    ]);
    insertSession({
      id: pcId,
      type: "pressure_cooker",
      username,
      timestamp: new Date().toISOString(),
      meta: { bestStreak },
    });
    insertPairwiseChoices(pcId, choices);

    // Also add to pairwise history
    const pwId = pcId + 1; // offset by 1ms to avoid collision
    setPairwiseSessions((prev) => [
      ...prev,
      { id: pwId, username, choices, timestamp: new Date().toISOString(), mode: "pressure-cooker", metadata: meta },
    ]);
    insertSession({
      id: pwId,
      type: "pairwise",
      username,
      timestamp: new Date().toISOString(),
      meta: { mode: "pressure-cooker" },
    });
    insertPairwiseChoices(pwId, choices);
  };

  return (
    <Results.Provider
      value={{
        // Transcripts
        transcripts,
        addTranscript,
        delTranscript,
        clearTranscripts,

        // Voice / Prompt
        announce,
        stopAnnouncing,
        toggleAnnouncing,
        isAnnouncing,
        isSpeaking,
        taskPrompt,
        setTaskPrompt,

        // Individual
        individualSessions,
        addIndividualSession,
        deleteIndividualSession,
        clearIndividual,

        // Flat Group (Legacy/Simple)
        groupSessions,
        addGroupSession,
        deleteGroupSession,
        clearGroup,

        // Layout Group (Complex)
        groupSessionsByLayout,
        getGroupSessions,
        addGroupSessionForLayout,
        deleteGroupSessionForLayout,
        clearGroupForLayout,
        clearAllGroupLayouts,

        // Fixed
        fixedSessions,
        addFixedSession,
        deleteFixedSession,
        clearFixedSessions,
        setFixedSessions,

        // Pairwise
        pairwiseSessions,
        addPairwiseSession,
        deletePairwiseSession,
        clearPairwise,

        // Ranked
        rankedSessions,
        addRankedSession,
        deleteRankedSession,
        clearRanked,

        // Best Worst
        bestWorstSessions,
        addBestWorstSession,
        deleteBestWorstSession,
        clearBestWorst,

        // Pressure Cooker
        pressureCookerSessions,
        addPressureCookerSession,
        clearPressureCooker,

        // Consent
        consentGiven,
        consentTimestamp,
        acceptConsent,
        revokeConsent,
        clearAllData,

        // Active Prompt (for ReadPromptButton)
        activePrompt,
        setActivePrompt,

        // Selection
        selectionSessions,
        addSelectionSession,
        deleteSelectionSession,
        clearSelection,

        // Engagement
        showSpeedWarning,
        setShowSpeedWarning,
        checkEngagement,
        resetEngagement,
      }}
    >
      {children}
    </Results.Provider>
  );
};