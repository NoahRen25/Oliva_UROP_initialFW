import React from "react";
import { useResults } from "../Results";
import ResultsPageShell from "../components/ResultsPageShell";
import PairwiseResultTable from "../components/PairwiseResultTable";

const extractStats = (session) => {
  const pts = [];
  session.choices.forEach((c) => {
    pts.push({ name: c.winnerName, value: 1 });
    pts.push({ name: c.loserName, value: 0 });
  });
  return pts;
};

const prepareData = (sessions) =>
  sessions.flatMap((s) =>
    s.choices.map((c) => ({
      "User ID": s.username,
      Timestamp: new Date(s.timestamp).toLocaleString(),
      "Pair ID": c.pairId,
      Winner: c.winnerName,
      Loser: c.loserName,
      "Winning Side": c.winnerSide,
    }))
  );

export default function PairwiseResult() {
  const { pairwiseSessions } = useResults();

  return (
    <ResultsPageShell
      title="Pairwise Results"
      sessions={pairwiseSessions}
      csvData={prepareData(pairwiseSessions)}
      csvFilename={`All_Pairwise_Results_${new Date().toISOString().split("T")[0]}.csv`}
      dataExtractor={extractStats}
    >
      <PairwiseResultTable
        sessions={pairwiseSessions}
        prepareData={prepareData}
        filenamePrefix="Pairwise"
      />
    </ResultsPageShell>
  );
}