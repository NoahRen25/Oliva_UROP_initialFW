import React, { createContext, useState, useContext, useEffect, useCallback } from "react";

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
  const [pressureCookerSessions, setPressureCookerSessions] = useState(() =>
    JSON.parse(localStorage.getItem("app_pressure_cooker")) || []
  );
  const [transcripts, setTranscripts] = useState(() =>
    JSON.parse(localStorage.getItem("app_transcripts")) || []
  );
  const [isAnnouncing, setIsAnnouncing] = useState(() =>
    JSON.parse(localStorage.getItem("app_announcing")) || false
  );

  // --- Consent State ---
  const [consentGiven, setConsentGiven] = useState(() =>
    JSON.parse(localStorage.getItem("app_consent_given")) || false
  );
  const [consentTimestamp, setConsentTimestamp] = useState(() =>
    localStorage.getItem("app_consent_timestamp") || null
  );

  // --- 2. Sync to Local Storage ---
  useEffect(() => localStorage.setItem("app_individual", JSON.stringify(individualSessions)), [individualSessions]);
  useEffect(() => localStorage.setItem("app_group", JSON.stringify(groupSessions)), [groupSessions]);
  useEffect(() => localStorage.setItem("app_pairwise", JSON.stringify(pairwiseSessions)), [pairwiseSessions]);
  useEffect(() => localStorage.setItem("app_ranked", JSON.stringify(rankedSessions)), [rankedSessions]);
  useEffect(() => localStorage.setItem("app_pressure_cooker", JSON.stringify(pressureCookerSessions)), [pressureCookerSessions]);
  useEffect(() => localStorage.setItem("app_transcripts", JSON.stringify(transcripts)), [transcripts]);
  useEffect(() => localStorage.setItem("app_announcing", JSON.stringify(isAnnouncing)), [isAnnouncing]);
  useEffect(() => localStorage.setItem("app_consent_given", JSON.stringify(consentGiven)), [consentGiven]);
  useEffect(() => { if (consentTimestamp) localStorage.setItem("app_consent_timestamp", consentTimestamp); }, [consentTimestamp]);

  // --- Consent Functions ---
  const acceptConsent = () => {
    const timestamp = new Date().toISOString();
    setConsentGiven(true);
    setConsentTimestamp(timestamp);
  };

  const revokeConsent = () => {
    setConsentGiven(false);
    setConsentTimestamp(null);
    localStorage.removeItem("app_consent_timestamp");
  };

  const clearAllData = () => {
    if (window.confirm("This will permanently delete ALL your data. Are you sure?")) {
      setIndividualSessions([]);
      setGroupSessions([]);
      setPairwiseSessions([]);
      setRankedSessions([]);
      setPressureCookerSessions([]);
      setTranscripts([]);
      revokeConsent();
    }
  };

  const toggleAnnouncing = () => {
    // If turning off, immediately silence any current speech
    if (isAnnouncing) {
      window.speechSynthesis.cancel();
    }
    setIsAnnouncing(prev => !prev);
  };

  const announce = useCallback((text) => {
    if (!isAnnouncing || !text) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get all available voices
    const voices = window.speechSynthesis.getVoices();
    console.log(voices)


    const preferredVoice = voices.find(v => v.name.includes("Karen") && v.lang.startsWith("en"))
                           || voices.find(v => v.lang.startsWith("en"))
                           || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Optional: Adjust the characteristics
    utterance.rate = 1.05;  // Speed (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)

    window.speechSynthesis.speak(utterance);
  },[[isAnnouncing]]);

  // --- 3. Add Data Functions ---
  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [...prev, { id: Date.now(), username, scores, timestamp: new Date() }]);
  };
  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [...prev, { id: Date.now(), username, scores, timestamp: new Date() }]);
  };
  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [...prev, { id: Date.now(), username, choices, timestamp: new Date() }]);
  };
  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [...prev, { id: Date.now(), username, rankings, timestamp: new Date() }]);
  };
  const addPressureCookerSession = (username, choices, bestStreak) => {
    setPressureCookerSessions((prev) => [
      ...prev,
      { id: Date.now(), username, choices, bestStreak, timestamp: new Date() },
    ]);
    // Also add to pairwise sessions for combined results
    setPairwiseSessions((prev) => [
      ...prev,
      { id: Date.now(), username, choices, timestamp: new Date(), mode: "pressure-cooker" },
    ]);
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

  // --- 4. Delete Functions (Individual) ---
  const deleteIndividualSession = (id, username) => {
    if(window.confirm(`Delete individual session by user ${username}?`)) {
      setIndividualSessions(prev => prev.filter(session => session.id != id));
    }
  };
  const deleteGroupSession = (id, username) => {
    if(window.confirm(`Delete group session by user ${username}?`)) {
      setGroupSessions(prev => prev.filter(session => session.id != id));
    }
  };
  const deletePairwiseSession = (id, username) => {
    if(window.confirm(`Delete session by user #${username} ?`)) {
      setPairwiseSessions(prev => prev.filter(session => session.id!= id));
    }
  };
  const deleteRankedSession = (id, username) => {
    if(window.confirm(`Delete this ranked session by user ${username}?`)) {
      setRankedSessions(prev => prev.filter(session => session.id!= id));
    }
  };
  const deletePressureCookerSession = (id, username) => {
    if(window.confirm(`Delete this pressure cooker session by user ${username}?`)) {
      setPressureCookerSessions(prev => prev.filter(session => session.id!= id));
    }
  };
  const delTranscript = (id, timestamp) => {
    if (window.confirm(`Delete this transcript from ${timestamp}?`)) {
      setTranscripts(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- 5. Clear All Functions ---
  const clearIndividual = () => {
    if(window.confirm("Delete ALL Individual sessions?")) setIndividualSessions([]);
  };
  const clearGroup = () => {
    if(window.confirm("Delete ALL Group sessions?")) setGroupSessions([]);
  };
  const clearPairwise = () => {
    if(window.confirm("Delete ALL Pairwise sessions?")) setPairwiseSessions([]);
  };
  const clearRanked = () => {
    if(window.confirm("Delete ALL Ranked sessions?")) setRankedSessions([]);
  };
  const clearPressureCooker = () => {
    if(window.confirm("Delete ALL Pressure Cooker sessions?")) setPressureCookerSessions([]);
  };
  const clearTranscripts = () => {
    if (window.confirm("Delete all transcripts?")) setTranscripts([]);
  };

  return (
    <Results.Provider
      value={{
        transcripts, addTranscript, delTranscript, clearTranscripts,
        individualSessions, addIndividualSession, deleteIndividualSession, clearIndividual,
        groupSessions, addGroupSession, deleteGroupSession, clearGroup,
        pairwiseSessions, addPairwiseSession, deletePairwiseSession, clearPairwise,
        rankedSessions, addRankedSession, deleteRankedSession, clearRanked,
        pressureCookerSessions, addPressureCookerSession, deletePressureCookerSession, clearPressureCooker,
        isAnnouncing, toggleAnnouncing, announce,
        consentGiven, consentTimestamp, acceptConsent, revokeConsent, clearAllData,
      }}
    >
      {children}
    </Results.Provider>
  );
};
