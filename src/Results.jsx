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
    return {
      individualSessions: [],
      groupSessions: [],
      pairwiseSessions: [],
      rankedSessions: [],
      transcripts: [],
    };
  }
  return context;
};

const useLocalStorage = (key, initialValue) => {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export const ResultsProvider = ({ children }) => {
  const [individualSessions, setIndividualSessions] = useLocalStorage("app_individual", []);
  const [groupSessions, setGroupSessions] = useLocalStorage("app_group", []);
  const [pairwiseSessions, setPairwiseSessions] = useLocalStorage("app_pairwise", []);
  const [rankedSessions, setRankedSessions] = useLocalStorage("app_ranked", []);
  const [bestWorstSessions, setBestWorstSessions] = useLocalStorage(
    "app_best_worst",
    []
  );
  const [transcripts, setTranscripts] = useLocalStorage("app_transcripts", []);
  
  const [isAnnouncing, setIsAnnouncing] = useLocalStorage("app_announcing", false);
  const [pressureCookerSessions, setPressureCookerSessions] = useState([]);
  const [showSpeedWarning, setShowSpeedWarning] = useState(false);

  const [lastWarnedIndex, setLastWarnedIndex] = useState(0);

  const resetEngagement = () => {
    setLastWarnedIndex(-2);
    setShowSpeedWarning(false);
  };
  const checkEngagement = (timesArray, currentIndex) => {
    //don't warn too often
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

  const toggleAnnouncing = () => {
    if (isAnnouncing) window.speechSynthesis.cancel();
    setIsAnnouncing((prev) => !prev);
  };

  const announce = useCallback((text) => {
    if (!isAnnouncing || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Karen")) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  }, [isAnnouncing]);

  // add functions
  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date().toISOString() },
    ]);
  };

  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date().toISOString() },
    ]);
  };

  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [
      ...prev,
      { id: Date.now(), username, choices, timestamp: new Date().toISOString() },
    ]);
  };

  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [
      ...prev,
      { id: Date.now(), username, rankings, timestamp: new Date().toISOString() },
    ]);
  };
  const addBestWorstSession = (username, trials) => {
    setBestWorstSessions((prev) => [
      ...prev,
      { id: Date.now(), username, trials, timestamp: new Date().toISOString() },
    ]);
  };
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

  // delete functions
  const deleteIndividualSession = (id, username) => {
    if (window.confirm(`Delete individual session by user ${username}?`)) {
      setIndividualSessions((prev) =>
        prev.filter((session) => session.id != id)
      );
    }
  };
  const deleteGroupSession = (id, username) => {
    if (window.confirm(`Delete group session by user ${username}?`)) {
      setGroupSessions((prev) => prev.filter((session) => session.id != id));
    }
  };
  const deletePairwiseSession = (id, username) => {
    if (window.confirm(`Delete session by user #${username} ?`)) {
      setPairwiseSessions((prev) => prev.filter((session) => session.id != id));
    }
  };
  const deleteRankedSession = (id, username) => {
    if (window.confirm(`Delete this ranked session by user ${username}?`)) {
      setRankedSessions((prev) => prev.filter((session) => session.id != id));
    }
  };
  const deleteBestWorstSession = (id, username) => {
    if (window.confirm(`Delete this best-worst session by user ${username}?`)) {
      setBestWorstSessions((prev) =>
        prev.filter((session) => session.id != id)
      );
    }
  };
  const delTranscript = (id, timestamp) => {
    if (window.confirm(`Delete this transcript from ${timestamp}?`)) {
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // clear functions
  const clearIndividual = () => {
    if (window.confirm("Delete ALL Individual sessions?"))
      setIndividualSessions([]);
  };
  const clearGroup = () => {
    if (window.confirm("Delete ALL Group sessions?")) setGroupSessions([]);
  };
  const clearPairwise = () => {
    if (window.confirm("Delete ALL Pairwise sessions?"))
      setPairwiseSessions([]);
  };
  const clearRanked = () => {
    if (window.confirm("Delete ALL Ranked sessions?")) setRankedSessions([]);
  };
  const clearBestWorst = () => {
    if (window.confirm("Delete ALL Best-Worst sessions?"))
      setBestWorstSessions([]);
  };
  const clearTranscripts = () => {
    if (window.confirm("Delete all transcripts?")) setTranscripts([]);
  };

  const addPressureCookerSession = (username, choices, bestStreak) => {
    setPressureCookerSessions((prev) => [
      ...prev,
      { username, choices, bestStreak, timestamp: new Date().toISOString() },
    ]);
    setPairwiseSessions((prev) => [
      ...prev,
      { username, choices, timestamp: new Date().toISOString(), mode: "pressure-cooker" },
    ]);
  };

  return (
    <Results.Provider
      value={{
        transcripts,
        addTranscript,
        delTranscript,
        clearTranscripts,
        individualSessions,
        addIndividualSession,
        deleteIndividualSession,
        clearIndividual,
        groupSessions,
        addGroupSession,
        deleteGroupSession,
        clearGroup,
        pairwiseSessions,
        addPairwiseSession,
        deletePairwiseSession,
        clearPairwise,
        rankedSessions,
        addRankedSession,
        deleteRankedSession,
        clearRanked,
        bestWorstSessions,
        addBestWorstSession,
        deleteBestWorstSession,
        clearBestWorst,
        isAnnouncing,
        toggleAnnouncing,
        announce,
        pressureCookerSessions,
        addPressureCookerSession,
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
