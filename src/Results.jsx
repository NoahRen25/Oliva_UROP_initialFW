import React, { createContext, useState, useContext } from "react";

const Results = createContext();

export const useResults = () => useContext(Results);

export const ResultsProvider = ({ children }) => {
  const [individualSessions, setIndividualSessions] = useState([]);
  const [groupSessions, setGroupSessions] = useState([]);
  const [pairwiseSessions, setPairwiseSessions] = useState([]);
  const [rankedSessions, setRankedSessions] = useState([]);


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
      }}
    >
      {children}
    </Results.Provider>
  );
};
