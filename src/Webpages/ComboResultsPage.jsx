/**
 * ComboResultsPage.jsx — "/combo-results": table + CSV export of all combo
 * protocol ("fixed") sessions, built from ResultsPageShell/GridResultTable.
 */
import React from "react";
import { useResults } from "../Results";
import ResultsPageShell from "../components/ResultsPageShell";
import GridResultTable from "../components/GridResultTable";

export default function ComboResultsPage() {
  const { fixedSessions, deleteFixedSession, clearFixedSessions } = useResults();

  const extractData = (session) =>
    (session.scores || []).map((s) => ({ name: s.imageName, value: s.score }));

  const csvData = fixedSessions.flatMap((s) =>
    s.scores.map((sc) => ({
      Username: s.username, Protocol: "Combo", Timestamp: s.timestamp,
      Image: sc.imageName, Position: sc.position, Score: sc.score,
      Moves: sc.interactionCount, ClickOrder: sc.clickOrder || "-",
    }))
  );

  return (
    <ResultsPageShell
      title="Combo Protocol Results"
      sessions={fixedSessions}
      csvData={csvData}
      csvFilename="combo_results_all.csv"
      onClear={clearFixedSessions}
      dataExtractor={extractData}
    >
      <GridResultTable
        sessions={fixedSessions}
        onDelete={(id) => deleteFixedSession(id)}
        csvPrefix="combo"
      />
    </ResultsPageShell>
  );
}