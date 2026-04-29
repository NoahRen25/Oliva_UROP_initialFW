import { useState, useCallback } from "react";

/**
 * useGridRating — Shared state and handlers for grid-based rating flows.
 * Used by both LayoutRatingFlow and ComboRatingFlow.
 *
 * Manages: ratings, slider moves, interaction sequence, click orders.
 */
export default function useGridRating() {
  const [ratings, setRatings] = useState({});
  const [sliderMoves, setSliderMoves] = useState({});
  const [interactionSequence, setInteractionSequence] = useState([]);
  const [savedClickOrders, setSavedClickOrders] = useState({});

  const handleInteraction = useCallback((id) => {
    setSliderMoves((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setInteractionSequence((prev) => {
      if (prev.includes(id)) return prev;
      const nextOrder = prev.length + 1;
      setSavedClickOrders((co) => ({ ...co, [id]: nextOrder }));
      return [...prev, id];
    });
  }, []);

  const resetPageInteractions = useCallback(() => {
    setInteractionSequence([]);
  }, []);

  return {
    ratings,
    setRatings,
    sliderMoves,
    savedClickOrders,
    handleInteraction,
    resetPageInteractions,
  };
}