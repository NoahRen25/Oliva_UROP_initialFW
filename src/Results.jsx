import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";

const Results = createContext({});

export const useResults = () => {
  const context = useContext(Results);
  if (!context) return { transcripts: [] };
  return context;
};

const useLocalStorage = (key, initialValue) => {
  const [state, setState] = useState(
    () => JSON.parse(localStorage.getItem(key)) || initialValue
  );
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
  return [state, setState];
};
export const ResultsProvider = ({ children }) => {
  // load initial state from local storage 
  const [individualSessions, setIndividualSessions] = useLocalStorage(
    "app_individual",
    []
  );
  const [groupSessions, setGroupSessions] = useLocalStorage("app_group", []);
  const [pairwiseSessions, setPairwiseSessions] = useLocalStorage(
    "app_pairwise",
    []
  );
  const [rankedSessions, setRankedSessions] = useLocalStorage("app_ranked", []);
  const [transcripts, setTranscripts] = useLocalStorage("app_transcripts", []);
  const [isAnnouncing, setIsAnnouncing] = useLocalStorage(
    "app_announcing",
    false
  );
  const [pressureCookerSessions, setPressureCookerSessions] = useState([]);

  const toggleAnnouncing = () => {
    // if turning off, immediately silence any current speech
    if (isAnnouncing) {
      window.speechSynthesis.cancel();
    }
    setIsAnnouncing((prev) => !prev);
  };

  const announce = useCallback(
    (text) => {
      if (!isAnnouncing || !text) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      console.log(voices);

      const preferredVoice =
        voices.find(
          (v) => v.name.includes("Karen") && v.lang.startsWith("en")
        ) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 1.05; // speed (0.1 to 10)
      utterance.pitch = 1.0; // pitch (0 to 2)

      window.speechSynthesis.speak(utterance);
    },
    [[isAnnouncing]]
  );
  //add data functions
  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date() },
    ]);
  };
  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [
      ...prev,
      { id: Date.now(), username, scores, timestamp: new Date() },
    ]);
  };
  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [
      ...prev,
      { id: Date.now(), username, choices, timestamp: new Date() },
    ]);
  };
  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [
      ...prev,
      { id: Date.now(), username, rankings, timestamp: new Date() },
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

  //delete functions (individual)
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
  const delTranscript = (id, timestamp) => {
    if (window.confirm(`Delete this transcript from ${timestamp}?`)) {
      setTranscripts((prev) => prev.filter((t) => t.id !== id));
    }
  };

  //clear all functions
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
  const clearTranscripts = () => {
    if (window.confirm("Delete all transcripts?")) setTranscripts([]);
  };

  const addPressureCookerSession = (username, choices, bestStreak) => {
    setPressureCookerSessions((prev) => [
      ...prev,
      { username, choices, bestStreak, timestamp: new Date() },
    ]);
    // also add to pairwise sessions for combined results
    setPairwiseSessions((prev) => [
      ...prev,
      { username, choices, timestamp: new Date(), mode: "pressure-cooker" },
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
        isAnnouncing,
        toggleAnnouncing,
        announce,
        pressureCookerSessions,
        addPressureCookerSession,
      }}
    >
      {children}
    </Results.Provider>
  );
};
