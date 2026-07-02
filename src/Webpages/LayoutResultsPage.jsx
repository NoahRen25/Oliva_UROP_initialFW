/**
 * LayoutResultsPage.jsx — Results table for one grid layout's sessions
 * (layout_group type, keyed by layoutId prop). Reused by ResultsPage for
 * each layout tab; supports per-session delete, clear-layout, and CSV
 * export.
 */
import React from "react";
import { useResults } from "../Results";
import ResultsPageShell from "../components/ResultsPageShell";
import GridResultTable from "../components/GridResultTable";

export default function LayoutResultsPage({ layoutId, title }) {
  const { getGroupSessions, deleteGroupSessionForLayout, clearGroupForLayout } = useResults();
  const sessions = getGroupSessions(layoutId);

  const extractData = (session) =>
    (session.scores || []).map((s) => ({ name: s.imageName || s.imageId, value: s.score }));

  const csvData = sessions.flatMap((s) =>
    s.scores.map((sc) => ({
      Username: s.username, Layout: layoutId, Timestamp: s.timestamp,
      Image: sc.imageName, Position: sc.position, Score: sc.score,
      Moves: sc.interactionCount, ClickOrder: sc.clickOrder || "-",
      TimeSpent: sc.timeSpent,
    }))
  );

  return (
    <ResultsPageShell
      title={title}
      sessions={sessions}
      csvData={csvData}
      csvFilename={`${layoutId}_results.csv`}
      onClear={() => clearGroupForLayout(layoutId)}
      dataExtractor={extractData}
    >
      <GridResultTable
        sessions={sessions}
        onDelete={(id, uname) => deleteGroupSessionForLayout(layoutId, id, uname)}
        csvPrefix={layoutId}
        showTimeColumn
        csvMapper={(session) =>
          session.scores.map((s) => ({
            Username: session.username, Image: s.imageName, Position: s.position,
            Score: s.score, Moves: s.interactionCount,
            ClickOrder: s.clickOrder || "-", TimeSpent: s.timeSpent,
          }))
        }
      />
    </ResultsPageShell>
  );
}