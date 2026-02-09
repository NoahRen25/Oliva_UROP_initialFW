import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const Results = createContext(null);

export const useResults = () => {
  const context = useContext(Results);
  if (!context) {
    // Return a safe default object containing empty states for all features
    return {
      transcripts: [],
      individualSessions: [],
      groupSessions: [],
      pairwiseSessions: [],
      rankedSessions: [],
      bestWorstSessions: [],
      fixedSessions: [],
      groupSessionsByLayout: {},
      pressureCookerSessions: [],
      taskPrompt: "",
      isSpeaking: false,
      isAnnouncing: false,
    };
  }
  return context;
};

// Constant for the task prompt used in File A
const defaultPrompt = "Rate how interesting this image would be to a general population";

const useLocalStorage = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export const ResultsProvider = ({ children }) => {
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================

  // --- Common Sessions ---
  const [individualSessions, setIndividualSessions] = useLocalStorage("app_individual", []);
  const [groupSessions, setGroupSessions] = useLocalStorage("app_group", []); // Flat group sessions (File B)
  const [transcripts, setTranscripts] = useLocalStorage("app_transcripts", []);

  // --- File A Specific (Layouts & Fixed) ---
  const [fixedSessions, setFixedSessions] = useLocalStorage("app_fixed_sessions", []);
  const [groupSessionsByLayout, setGroupSessionsByLayout] = useLocalStorage("app_group_by_layout", {});
  const [taskPrompt, setTaskPrompt] = useState(defaultPrompt);

  // --- File B Specific (Modes) ---
  const [pairwiseSessions, setPairwiseSessions] = useLocalStorage("app_pairwise", []);
  const [rankedSessions, setRankedSessions] = useLocalStorage("app_ranked", []);
  const [bestWorstSessions, setBestWorstSessions] = useLocalStorage("app_best_worst", []);
  const [pressureCookerSessions, setPressureCookerSessions] = useState([]);

  // --- Voice / Audio State ---
  const [isAnnouncing, setIsAnnouncing] = useLocalStorage("app_announcing", false); // Preference (File B)
  const [isSpeaking, setIsSpeaking] = useState(false); // Active Status (File A)

  // --- Engagement / Speed Warning (File B) ---
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);
  const [lastWarnedIndex, setLastWarnedIndex] = useState(0);

  // ==========================================
  // ENGAGEMENT LOGIC (File B)
  // ==========================================

  const resetEngagement = () => {
    setLastWarnedIndex(-2);
    setShowSpeedWarning(false);
  };

  const checkEngagement = (timesArray, currentIndex) => {
    // don't warn too often
    if (currentIndex - lastWarnedIndex < 2) return true;
    if (timesArray.length < 2) return true;

    const total = timesArray.reduce((acc, curr) => acc + curr, 0);
    const average = total / timesArray.length;

    if (average < 10.0) {
      setShowSpeedWarning(true);
      setLastWarnedIndex(currentIndex);
      return false;
    }
    return true;
  };

  // ==========================================
  // SPEECH LOGIC (Merged)
  // ==========================================

  // Toggle the preference (File B)
  const toggleAnnouncing = () => {
    if (isAnnouncing) window.speechSynthesis.cancel();
    setIsAnnouncing((prev) => !prev);
  };

  // Hard stop (File A)
  const stopAnnouncing = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Announce (Merged Logic)
  const announce = useCallback(
    (text) => {
      // Check preference first (File B requirement)
      if (!isAnnouncing) return;
      if (!text) return;

      // Cancel current speech (File A requirement)
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const setVoiceAndSpeak = () => {
        const voices = window.speechSynthesis.getVoices();

        // Robust voice selection (File A)
        const preferredVoice =
          voices.find((v) => v.name.includes("Karen") && v.lang.startsWith("en")) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];

        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        // UI Feedback handlers (File A)
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length !== 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = setVoiceAndSpeak;
      }
    },
    [isAnnouncing]
  );

  // ==========================================
  // DATA MANAGEMENT FUNCTIONS
  // ==========================================

  // --- Transcripts (Common) ---
  const addTranscript = (text, duration) => {
    if (!text.trim()) return;
    const newEntry = {
      id: Date.now(),
      text: text.trim(),
      duration: duration,
      timestamp: new Date().toLocaleString(),
      length: text.trim().length,
    };
    setTranscripts((prev) => [newEntry, ...prev]);
  };

  const delTranscript = (id, timestamp) => {
    if (window.confirm(`Delete this transcript from ${timestamp}?`)) {
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const clearTranscripts = () => {
    if (window.confirm("Delete all transcripts?")) setTranscripts([]);
  };

  // --- Individual Sessions (Common) ---
  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date().toISOString() },
    ]);
  };

  const deleteIndividualSession = (id, username) => {
    if (window.confirm(`Delete individual session by user ${username}?`)) {
      setIndividualSessions((prev) => prev.filter((session) => session.id != id));
    }
  };

  const clearIndividual = () => {
    if (window.confirm("Delete ALL Individual sessions?")) setIndividualSessions([]);
  };

  // --- Flat Group Sessions (File B Style) ---
  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date().toISOString() },
    ]);
  };

  const deleteGroupSession = (id, username) => {
    if (window.confirm(`Delete group session by user ${username}?`)) {
      setGroupSessions((prev) => prev.filter((session) => session.id != id));
    }
  };

  const clearGroup = () => {
    if (window.confirm("Delete ALL Group sessions?")) setGroupSessions([]);
  };

  // --- Layout Group Sessions (File A Style) ---
  const addGroupSessionForLayout = (layoutId, username, scores, meta = {}) => {
    setGroupSessionsByLayout((prev) => {
      const next = { ...(prev || {}) };
      const list = next[layoutId] || [];
      next[layoutId] = [
        ...list,
        {
          id: Date.now(),
          username,
          scores,
          meta,
          layoutId,
          timestamp: new Date(),
        },
      ];
      return next;
    });
  };

  const getGroupSessions = (layoutId) => {
    if (!layoutId) return [];
    return (groupSessionsByLayout && groupSessionsByLayout[layoutId]) || [];
  };

  const deleteGroupSessionForLayout = (layoutId, id, username) => {
    if (window.confirm(`Delete ${layoutId} session by user ${username}?`)) {
      setGroupSessionsByLayout((prev) => {
        const next = { ...(prev || {}) };
        next[layoutId] = (next[layoutId] || []).filter((s) => s.id != id);
        return next;
      });
    }
  };

  const clearGroupForLayout = (layoutId) => {
    if (window.confirm(`Delete ALL Group sessions for ${layoutId}?`)) {
      setGroupSessionsByLayout((prev) => {
        const next = { ...(prev || {}) };
        next[layoutId] = [];
        return next;
      });
    }
  };

  const clearAllGroupLayouts = () => {
    if (window.confirm("Delete ALL Group sessions across ALL layouts?")) {
      setGroupSessionsByLayout({});
    }
  };

  // --- Fixed Sessions (File A) ---
  const addFixedSession = (username, scores) => {
    setFixedSessions((prev) => [
      ...prev,
      {
        id: Date.now(),
        username,
        scores,
        timestamp: new Date().toLocaleString(),
      },
    ]);
  };

  const deleteFixedSession = (sessionId) => {
    if (window.confirm("Are you sure you want to delete this specific session?")) {
      setFixedSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const clearFixedSessions = () => {
    if (window.confirm("Clear all fixed protocol results?")) setFixedSessions([]);
  };

  // --- Pairwise Sessions (File B) ---
  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [
      ...prev,
      { id: Date.now(), username, choices, timestamp: new Date().toISOString() },
    ]);
  };

  const deletePairwiseSession = (id, username) => {
    if (window.confirm(`Delete session by user #${username} ?`)) {
      setPairwiseSessions((prev) => prev.filter((session) => session.id != id));
    }
  };

  const clearPairwise = () => {
    if (window.confirm("Delete ALL Pairwise sessions?")) setPairwiseSessions([]);
  };

  // --- Ranked Sessions (File B) ---
  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [
      ...prev,
      { id: Date.now(), username, rankings, timestamp: new Date().toISOString() },
    ]);
  };

  const deleteRankedSession = (id, username) => {
    if (window.confirm(`Delete this ranked session by user ${username}?`)) {
      setRankedSessions((prev) => prev.filter((session) => session.id != id));
    }
  };

  const clearRanked = () => {
    if (window.confirm("Delete ALL Ranked sessions?")) setRankedSessions([]);
  };

  // --- Best-Worst Sessions (File B) ---
  const addBestWorstSession = (username, trials) => {
    setBestWorstSessions((prev) => [
      ...prev,
      { id: Date.now(), username, trials, timestamp: new Date().toISOString() },
    ]);
  };

  const deleteBestWorstSession = (id, username) => {
    if (window.confirm(`Delete this best-worst session by user ${username}?`)) {
      setBestWorstSessions((prev) => prev.filter((session) => session.id != id));
    }
  };

  const clearBestWorst = () => {
    if (window.confirm("Delete ALL Best-Worst sessions?")) setBestWorstSessions([]);
  };

  // --- Pressure Cooker (File B) ---
  const addPressureCookerSession = (username, choices, bestStreak) => {
    setPressureCookerSessions((prev) => [
      ...prev,
      { username, choices, bestStreak, timestamp: new Date().toISOString() },
    ]);
    // Also add to pairwise history
    setPairwiseSessions((prev) => [
      ...prev,
      { username, choices, timestamp: new Date().toISOString(), mode: "pressure-cooker" },
    ]);
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
        isAnnouncing, // Preference state
        isSpeaking,   // Active state
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