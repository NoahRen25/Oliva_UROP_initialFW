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
  const [transcripts, setTranscripts] = useState(() => 
    JSON.parse(localStorage.getItem("app_transcripts")) || []
  );
  const [isAnnouncing, setIsAnnouncing] = useState(() => 
    JSON.parse(localStorage.getItem("app_announcing")) || false
  );

  // --- 2. Sync to Local Storage ---
  useEffect(() => localStorage.setItem("app_individual", JSON.stringify(individualSessions)), [individualSessions]);
  useEffect(() => localStorage.setItem("app_group", JSON.stringify(groupSessions)), [groupSessions]);
  useEffect(() => localStorage.setItem("app_pairwise", JSON.stringify(pairwiseSessions)), [pairwiseSessions]);
  useEffect(() => localStorage.setItem("app_ranked", JSON.stringify(rankedSessions)), [rankedSessions]);
  useEffect(() => localStorage.setItem("app_transcripts", JSON.stringify(transcripts)), [transcripts]);
  useEffect(() => localStorage.setItem("app_announcing", JSON.stringify(isAnnouncing)), [isAnnouncing]);

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
  
    /** * CHANGE VOICE HERE:
     * You can look for "Google", "Female", or specific language codes like "en-GB".
     * This logic tries to find a 'Google' voice (usually higher quality), 
     * otherwise it falls back to the first available voice.
     */
    const preferredVoice = voices.find(v => v.name.includes("Karen") && v.lang.startsWith("en")) 
                           || voices.find(v => v.lang.startsWith("en"))
                           || voices[0];
  
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  
    // Optional: Adjust the characteristics
    utterance.rate = 3.0;  // Speed (0.1 to 10)
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
  const deleteIndividualSession = (index) => {
    if(window.confirm("Delete this individual session?")) {
      setIndividualSessions(prev => prev.filter((_, i) => i !== index));
    }
  };
  const deleteGroupSession = (index) => {
    if(window.confirm("Delete this group session?")) {
      setGroupSessions(prev => prev.filter((_, i) => i !== index));
    }
  };
  const deletePairwiseSession = (id, username) => {
    if(window.confirm(`Delete session by user #${username} ?`)) {
      setPairwiseSessions(prev => prev.filter(session => session.id!= id));
    }
  };
  const deleteRankedSession = (index) => {
    if(window.confirm("Delete this ranked session?")) {
      setRankedSessions(prev => prev.filter((_, i) => i !== index));
    }
  };
  const delTranscript = (id) => {
    if (window.confirm("Delete this transcript?")) {
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
        isAnnouncing, toggleAnnouncing, announce,
      }}
    >
      {children}
    </Results.Provider>
  );
};