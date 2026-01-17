import React, { createContext, useState, useContext, useEffect } from "react";

const Results = createContext({});

export const useResults = () => {
  const context = useContext(Results);
  if (!context) return { transcripts: [] };
  return context;
};

export const ResultsProvider = ({ children }) => {
  // --- 1. Load Initial State from Local Storage ---
  const [individualSessions, setIndividualSessions] = useState(() => 
    JSON.parse(localStorage.getItem("app_individual")) || []
  );
  const [groupSessions, setGroupSessions] = useState(() => 
    JSON.parse(localStorage.getItem("app_group")) || []
  );
  const [pairwiseSessions, setPairwiseSessions] = useState(() => 
    JSON.parse(localStorage.getItem("app_pairwise")) || []
  );
  const [rankedSessions, setRankedSessions] = useState(() => 
    JSON.parse(localStorage.getItem("app_ranked")) || []
  );
  const [transcripts, setTranscripts] = useState(() => 
    JSON.parse(localStorage.getItem("app_transcripts")) || []
  );

  // --- 2. Save to Local Storage whenever data changes ---
  useEffect(() => localStorage.setItem("app_individual", JSON.stringify(individualSessions)), [individualSessions]);
  useEffect(() => localStorage.setItem("app_group", JSON.stringify(groupSessions)), [groupSessions]);
  useEffect(() => localStorage.setItem("app_pairwise", JSON.stringify(pairwiseSessions)), [pairwiseSessions]);
  useEffect(() => localStorage.setItem("app_ranked", JSON.stringify(rankedSessions)), [rankedSessions]);
  useEffect(() => localStorage.setItem("app_transcripts", JSON.stringify(transcripts)), [transcripts]);

  // --- 3. Add Data Functions ---
  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [...prev, { username, scores, timestamp: new Date() }]);
  };

  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [...prev, { username, scores, timestamp: new Date() }]);
  };
  
  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [...prev, { username, choices, timestamp: new Date() }]);
  };

  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [...prev, { username, rankings, timestamp: new Date() }]);
  };

  const addTranscript = (text, duration) => {
    if (!text.trim()) return;
    const newEntry = { 
      id: Date.now(), 
      text: text.trim(), 
      duration: duration, 
      timestamp: new Date().toLocaleString(),
      length: text.trim().length 
    };
    setTranscripts(prev => [newEntry, ...prev]);
  };

  // --- 4. Clearing Functions ---
  const clearTranscripts = () => {
    if (window.confirm("Delete all recording history?")) {
      setTranscripts([]);
    }
  };

  const clearAllData = () => {
    if (window.confirm("CRITICAL: This will delete ALL session data and transcripts. Are you sure?")) {
      setIndividualSessions([]);
      setGroupSessions([]);
      setPairwiseSessions([]);
      setRankedSessions([]);
      setTranscripts([]);
      localStorage.clear();
    }
  };

  return (
    <Results.Provider
      value={{
        transcripts, addTranscript, clearTranscripts,
        individualSessions, addIndividualSession,
        groupSessions, addGroupSession,
        pairwiseSessions, addPairwiseSession,
        rankedSessions, addRankedSession,
        clearAllData // Helper to wipe everything if needed
      }}
    >
      {children}
    </Results.Provider>
  );
};