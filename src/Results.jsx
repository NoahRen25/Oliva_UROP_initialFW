import React, { createContext, useState, useContext } from "react";

const Results = createContext();

export const useResults = () => useContext(Results);

export const ResultsProvider = ({ children }) => {
  const [individualSessions, setIndividualSessions] = useState([]);
  const [groupSessions, setGroupSessions] = useState([]);
  const [pairwiseSessions, setPairwiseSessions] = useState([]);
  const [rankedSessions, setRankedSessions] = useState([]);
  const [pressureCookerSessions, setPressureCookerSessions] = useState([]);


  const addIndividualSession = (username, scores) => {
    setIndividualSessions((prev) => [
      ...prev,
      { username, scores, timestamp: new Date() },
    ]);
  };

  const addGroupSession = (username, scores) => {
    setGroupSessions((prev) => [
      ...prev,
      { username, scores, timestamp: new Date() },
    ]);
  };
  
  const addPairwiseSession = (username, choices) => {
    setPairwiseSessions((prev) => [
      ...prev,
      { username, choices, timestamp: new Date() },
    ]);
  };

  const addRankedSession = (username, rankings) => {
    setRankedSessions((prev) => [
      ...prev,
      { username, rankings, timestamp: new Date() },
    ]);
  };

  const addPressureCookerSession = (username, choices, bestStreak) => {
    setPressureCookerSessions((prev) => [
      ...prev,
      { username, choices, bestStreak, timestamp: new Date() },
    ]);
    // Also add to pairwise sessions for combined results
    setPairwiseSessions((prev) => [
      ...prev,
      { username, choices, timestamp: new Date(), mode: "pressure-cooker" },
    ]);
  };

  return (
    <Results.Provider
      value={{
        individualSessions,
        addIndividualSession,
        groupSessions,
        addGroupSession,
        // Export new ones
        pairwiseSessions,
        addPairwiseSession,
        rankedSessions,
        addRankedSession,
        pressureCookerSessions,
        addPressureCookerSession,
      }}
    >
      {children}
    </Results.Provider>
  );
};
