/**
 * Results.jsx — Global session store (ResultsProvider / useResults).
 *
 * Holds every kind of completed rating session in React state (individual,
 * group, layout-group, fixed, pairwise, video-pairwise, ranked, selection)
 * plus voice transcripts, consent state, and the anti-rushing "speed check"
 * logic (checkEngagement / resetEngagement).
 *
 * On mount it hydrates all state from Supabase (services/supabaseResults.js);
 * every add/delete helper writes through to Supabase so React state and the
 * database stay in sync. Rating pages call the add*Session helpers on submit;
 * results dashboards read the session arrays.
 */
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
  deleteAllSessions,
  insertRatingScores,
  insertPairwiseChoices,
  insertRankedResults,
  insertTranscript as sbInsertTranscript,
  deleteTranscript as sbDeleteTranscript,
  deleteAllTranscripts as sbDeleteAllTranscripts,
  fetchSessionsWithScores,
  fetchSessionsWithChoices,
  fetchSessionsWithRankings,
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
      videoPairwiseSessions: [],
      rankedSessions: [],
      selectionSessions: [],
      fixedSessions: [],
      groupSessionsByLayout: {},
      taskPrompt: "",
      activePrompt: null,
      setActivePrompt: () => {},
      currentRatingPage: null,
      setCurrentRatingPage: () => {},
      speedThresholdSec: 2,
    };
  }
  return context;
};

const defaultPrompt = "Rate how interesting this image would be to a general population";

export const ResultsProvider = ({ children }) => {
  // --- All state starts empty, hydrated from Supabase ---
  const [individualSessions, setIndividualSessions] = useState([]);
  const [groupSessions, setGroupSessions] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [fixedSessions, setFixedSessions] = useState([]);
  const [groupSessionsByLayout, setGroupSessionsByLayout] = useState({});
  const [taskPrompt, setTaskPrompt] = useState(defaultPrompt);
  const [pairwiseSessions, setPairwiseSessions] = useState([]);
  const [rankedSessions, setRankedSessions] = useState([]);
  const [selectionSessions, setSelectionSessions] = useState([]);
  const [videoPairwiseSessions, setVideoPairwiseSessions] = useState([]);

  // --- UI-only state (not persisted) ---
  const [activePrompt, setActivePrompt] = useState(null);
  const [currentRatingPage, setCurrentRatingPage] = useState(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentTimestamp, setConsentTimestamp] = useState(null);
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  const [speedThresholdSec, setSpeedThresholdSec] = useState(2);

  // --- Loading state ---
  const [hydrated, setHydrated] = useState(false);

  // ─── Supabase hydration (single source of truth) ─────────────
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [indiv, group, fixed, pairwise, videoPw, ranked, trans] =
          await Promise.all([
            fetchSessionsWithScores("individual"),
            fetchSessionsWithScores("group"),
            fetchSessionsWithScores("fixed"),
            fetchSessionsWithChoices("pairwise"),
            fetchSessionsWithChoices("video_pairwise"),
            fetchSessionsWithRankings(),
            fetchTranscripts(),
          ]);

        if (cancelled) return;

        setIndividualSessions(indiv);
        setGroupSessions(group);
        setFixedSessions(fixed);
        setPairwiseSessions(pairwise);
        setVideoPairwiseSessions(videoPw);
        setRankedSessions(ranked);
        setTranscripts(trans);

        // Layout group sessions
        const layoutSessions = await fetchSessionsWithScores("layout_group");
        if (!cancelled && layoutSessions.length) {
          const byLayout = {};
          for (const s of layoutSessions) {
            const lid = s.layoutId || s.meta?.layoutId;
            if (!lid) continue;
            if (!byLayout[lid]) byLayout[lid] = [];
            byLayout[lid].push(s);
          }
          setGroupSessionsByLayout(byLayout);
        }

        // Selection sessions
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
        console.error("Supabase hydration failed:", err.message);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    hydrate();
    return () => { cancelled = true; };
  }, []);

  // ─── Engagement logic ─────────────────────────────────────────
  // Memoized so that consumers can safely use these in useEffect deps without
  // triggering re-runs on every Results re-render. Without this, calling
  // setShowSpeedWarning(true) inside checkEngagement re-renders Results, which
  // would re-run any `[step, resetEngagement]` effect and immediately close
  // the modal.
  const resetEngagement = useCallback(() => {
    setShowSpeedWarning(false);
  }, []);

  const checkEngagement = useCallback((timesArray, imagesPerPage = 1) => {
    if (!timesArray || timesArray.length < 1) return true;
    const last = timesArray[timesArray.length - 1];
    const avg = timesArray.reduce((a, c) => a + c, 0) / timesArray.length;
    const threshold = 2.0 * Math.max(1, imagesPerPage);
    const tooFast = last < threshold || (timesArray.length >= 2 && avg < threshold);
    if (tooFast) {
      setSpeedThresholdSec(threshold);
      setShowSpeedWarning(true);
      return false;
    }
    return true;
  }, []);

  // ─── Transcripts ──────────────────────────────────────────────
  const addTranscript = (text, duration) => {
    if (!text.trim()) return;
    const entry = {
      id: Date.now(),
      text: text.trim(),
      duration,
      timestamp: new Date().toLocaleString(),
      length: text.trim().length,
    };
    setTranscripts((p) => [entry, ...p]);
    sbInsertTranscript(entry);
  };

  const delTranscript = (id, timestamp) => {
    if (window.confirm(`Delete transcript from ${timestamp}?`)) {
      setTranscripts((p) => p.filter((t) => t.id !== id));
      sbDeleteTranscript(id);
    }
  };

  const clearTranscripts = () => {
    if (window.confirm("Delete all transcripts?")) {
      setTranscripts([]);
      sbDeleteAllTranscripts();
    }
  };

  // ─── Individual Sessions ──────────────────────────────────────
  const addIndividualSession = (username, scores, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      scores,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setIndividualSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "individual",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertRatingScores(session.id, scores);
  };

  const deleteIndividualSession = (id, username) => {
    if (window.confirm(`Delete session by ${username}?`)) {
      setIndividualSessions((p) => p.filter((s) => s.id != id));
      deleteSession(id);
    }
  };

  const clearIndividual = () => {
    if (window.confirm("Delete ALL Individual sessions?")) {
      setIndividualSessions([]);
      deleteSessionsByType("individual");
    }
  };

  // ─── Group Sessions ───────────────────────────────────────────
  const addGroupSession = (username, scores, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      scores,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setGroupSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "group",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertRatingScores(session.id, scores);
  };

  const deleteGroupSession = (id, username) => {
    if (window.confirm(`Delete session by ${username}?`)) {
      setGroupSessions((p) => p.filter((s) => s.id != id));
      deleteSession(id);
    }
  };

  const clearGroup = () => {
    if (window.confirm("Delete ALL Group sessions?")) {
      setGroupSessions([]);
      deleteSessionsByType("group");
    }
  };

  // ─── Layout Group Sessions ────────────────────────────────────
  const addGroupSessionForLayout = (layoutId, username, scores, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      scores,
      meta,
      layoutId,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setGroupSessionsByLayout((p) => {
      const n = { ...(p || {}) };
      n[layoutId] = [...(n[layoutId] || []), session];
      return n;
    });
    insertSession({
      id: session.id,
      type: "layout_group",
      username,
      timestamp: session.timestamp,
      meta: { ...meta, layoutId },
    });
    insertRatingScores(session.id, scores);
  };

  const getGroupSessions = (layoutId) =>
    (groupSessionsByLayout && groupSessionsByLayout[layoutId]) || [];

  const deleteGroupSessionForLayout = (layoutId, id, username) => {
    if (window.confirm(`Delete ${layoutId} session by ${username}?`)) {
      setGroupSessionsByLayout((p) => {
        const n = { ...(p || {}) };
        n[layoutId] = (n[layoutId] || []).filter((s) => s.id != id);
        return n;
      });
      deleteSession(id);
    }
  };

  const clearGroupForLayout = (layoutId) => {
    if (window.confirm(`Delete ALL sessions for ${layoutId}?`)) {
      setGroupSessionsByLayout((p) => {
        const n = { ...(p || {}) };
        (n[layoutId] || []).forEach((s) => deleteSession(s.id));
        n[layoutId] = [];
        return n;
      });
    }
  };

  const clearAllGroupLayouts = () => {
    if (window.confirm("Delete ALL Group sessions across ALL layouts?")) {
      Object.values(groupSessionsByLayout || {}).flat().forEach((s) => deleteSession(s.id));
      setGroupSessionsByLayout({});
    }
  };

  // ─── Fixed Sessions ───────────────────────────────────────────
  const addFixedSession = (username, scores, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      scores,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setFixedSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "fixed",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertRatingScores(session.id, scores);
  };

  const deleteFixedSession = (sessionId) => {
    if (window.confirm("Delete this session?")) {
      setFixedSessions((p) => p.filter((s) => s.id !== sessionId));
      deleteSession(sessionId);
    }
  };

  const clearFixedSessions = () => {
    if (window.confirm("Clear all fixed results?")) {
      setFixedSessions([]);
      deleteSessionsByType("fixed");
    }
  };

  // ─── Pairwise Sessions ────────────────────────────────────────
  const addPairwiseSession = (username, choices, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      choices,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setPairwiseSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "pairwise",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertPairwiseChoices(session.id, choices);
  };

  const deletePairwiseSession = (id, username) => {
    if (window.confirm(`Delete session by ${username}?`)) {
      setPairwiseSessions((p) => p.filter((s) => s.id != id));
      deleteSession(id);
    }
  };

  const clearPairwise = () => {
    if (window.confirm("Delete ALL Pairwise sessions?")) {
      setPairwiseSessions([]);
      deleteSessionsByType("pairwise");
    }
  };

  // ─── Video Pairwise Sessions ──────────────────────────────────
  const addVideoPairwiseSession = (username, choices, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      choices,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setVideoPairwiseSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "video_pairwise",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertPairwiseChoices(session.id, choices);
  };

  const deleteVideoPairwiseSession = (id, username) => {
    if (window.confirm(`Delete session by ${username}?`)) {
      setVideoPairwiseSessions((p) => p.filter((s) => s.id != id));
      deleteSession(id);
    }
  };

  const clearVideoPairwise = () => {
    if (window.confirm("Delete ALL Video Pairwise sessions?")) {
      setVideoPairwiseSessions([]);
      deleteSessionsByType("video_pairwise");
    }
  };

  // ─── Ranked Sessions ──────────────────────────────────────────
  const addRankedSession = (username, rankings, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      rankings,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setRankedSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "ranked",
      username,
      timestamp: session.timestamp,
      meta: { pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertRankedResults(session.id, rankings);
  };

  const deleteRankedSession = (id, username) => {
    if (window.confirm(`Delete session by ${username}?`)) {
      setRankedSessions((p) => p.filter((s) => s.id != id));
      deleteSession(id);
    }
  };

  const clearRanked = () => {
    if (window.confirm("Delete ALL Ranked sessions?")) {
      setRankedSessions([]);
      deleteSessionsByType("ranked");
    }
  };

  // ─── Selection Sessions ───────────────────────────────────────
  const addSelectionSession = (username, prompt, selections, meta = {}) => {
    const session = {
      id: Date.now(),
      username,
      prompt,
      selections,
      timestamp: new Date().toISOString(),
      pageTranscripts: meta.pageTranscripts || {},
      pageAudioUrls: meta.pageAudioUrls || {},
    };
    setSelectionSessions((p) => [...p, session]);
    insertSession({
      id: session.id,
      type: "selection",
      username,
      timestamp: session.timestamp,
      meta: { prompt, pageTranscripts: meta.pageTranscripts, pageAudioUrls: meta.pageAudioUrls },
    });
    insertRatingScores(
      session.id,
      selections.map((s) => ({
        imageId: s.imageId,
        imageName: s.imageName,
        prompt: s.imagePrompt,
        score: s.selected ? 1 : 0,
        interactionCount: 0,
      }))
    );
  };

  const deleteSelectionSession = (id) => {
    if (window.confirm("Delete this session?")) {
      setSelectionSessions((p) => p.filter((s) => s.id !== id));
      deleteSession(id);
    }
  };

  const clearSelection = () => {
    if (window.confirm("Delete ALL Selection sessions?")) {
      setSelectionSessions([]);
      deleteSessionsByType("selection");
    }
  };

  // ─── Consent ──────────────────────────────────────────────────
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

  // ─── Clear ALL data ───────────────────────────────────────────
  const clearAllData = () => {
    if (window.confirm("This will delete ALL your data and revoke consent. Are you sure?")) {
      setIndividualSessions([]);
      setGroupSessions([]);
      setPairwiseSessions([]);
      setRankedSessions([]);
      setSelectionSessions([]);
      setVideoPairwiseSessions([]);
      setTranscripts([]);
      setFixedSessions([]);
      setGroupSessionsByLayout({});
      setConsentGiven(false);
      setConsentTimestamp(null);
      deleteAllSessions();
      sbDeleteAllTranscripts();
    }
  };

  return (
    <Results.Provider
      value={{
        // Loading
        hydrated,

        // Transcripts
        transcripts,
        addTranscript,
        delTranscript,
        clearTranscripts,

        // Voice / Prompt
        taskPrompt,
        setTaskPrompt,

        // Active Prompt (for ReadPromptButton)
        activePrompt,
        setActivePrompt,

        // Page tracking (for page-aware recording)
        currentRatingPage,
        setCurrentRatingPage,

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

        // Video Pairwise
        videoPairwiseSessions,
        addVideoPairwiseSession,
        deleteVideoPairwiseSession,
        clearVideoPairwise,

        // Ranked
        rankedSessions,
        addRankedSession,
        deleteRankedSession,
        clearRanked,

        // Consent
        consentGiven,
        consentTimestamp,
        acceptConsent,
        revokeConsent,
        clearAllData,

        // Selection
        selectionSessions,
        addSelectionSession,
        deleteSelectionSession,
        clearSelection,

        // Engagement
        showSpeedWarning,
        setShowSpeedWarning,
        speedThresholdSec,
        checkEngagement,
        resetEngagement,
      }}
    >
      {children}
    </Results.Provider>
  );
};