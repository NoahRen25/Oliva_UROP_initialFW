export function computeSessionAverages(session) {
    const scores = session.scores || [];
    const hasScores = scores.length > 0;
  
    const avgScore = hasScores
      ? (scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / scores.length).toFixed(2)
      : "N/A";
  
    const avgTime = hasScores
      ? (
          scores.reduce((sum, s) => sum + (parseFloat(s.timeSpent) || 0), 0) /
          scores.length
        ).toFixed(2)
      : "N/A";
  
    const avgMoves = hasScores
      ? (
          scores.reduce((sum, s) => sum + (Number(s.interactionCount) || 0), 0) /
          scores.length
        ).toFixed(1)
      : "N/A";
  
    return { avgScore, avgTime, avgMoves };
  }
  