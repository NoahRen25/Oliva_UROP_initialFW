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

  // delete/clear functions
  const deleteIndividualSession = (id) => setIndividualSessions(p => p.filter(s => s.id !== id));
  const deleteGroupSession = (id) => setGroupSessions(p => p.filter(s => s.id !== id));
  const deletePairwiseSession = (id) => setPairwiseSessions(p => p.filter(s => s.id !== id));
  const deleteRankedSession = (id) => setRankedSessions(p => p.filter(s => s.id !== id));

  const clearIndividual = () => { if(window.confirm("Clear all?")) setIndividualSessions([]); };
  const clearGroup = () => { if(window.confirm("Clear all?")) setGroupSessions([]); };
  const clearPairwise = () => { if(window.confirm("Clear all?")) setPairwiseSessions([]); };
  const clearRanked = () => { if(window.confirm("Clear all?")) setRankedSessions([]); };

  return (
    <Results.Provider
      value={{
        individualSessions, addIndividualSession, deleteIndividualSession, clearIndividual,
        groupSessions, addGroupSession, deleteGroupSession, clearGroup,
        pairwiseSessions, addPairwiseSession, deletePairwiseSession, clearPairwise,
        rankedSessions, addRankedSession, deleteRankedSession, clearRanked,
        transcripts, isAnnouncing, toggleAnnouncing, announce,
        showSpeedWarning, setShowSpeedWarning, checkEngagement, resetEngagement,
      }}
    >
      {children}
    </Results.Provider>
  );
};