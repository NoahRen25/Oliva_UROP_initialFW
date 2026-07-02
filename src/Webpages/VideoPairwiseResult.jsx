/**
 * VideoPairwiseResult.jsx — Results view for video pairwise sessions
 * (winner/loser + prompt per pair, CSV export). Shown as the "Video
 * Pairwise" tab of ModeResultsPage.
 */
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
      Prompt: c.prompt || "",
      Winner: c.winnerName,
      Loser: c.loserName,
      "Winning Side": c.winnerSide,
    }))
  );

export default function VideoPairwiseResult() {
  const { videoPairwiseSessions } = useResults();

  return (
    <ResultsPageShell
      title="Video Pairwise Results"
      sessions={videoPairwiseSessions}
      csvData={prepareData(videoPairwiseSessions)}
      csvFilename={`All_Video_Pairwise_Results_${new Date().toISOString().split("T")[0]}.csv`}
      dataExtractor={extractStats}
    >
      <PairwiseResultTable
        sessions={videoPairwiseSessions}
        prepareData={prepareData}
        filenamePrefix="Video_Pairwise"
      />
    </ResultsPageShell>
  );
}