import { useEffect, useCallback } from "react";

export default function useKeyboardShortcuts({
  onRatingChange,
  onNext,
  onUndo,
  onSelectLeft,
  onSelectRight,
  enabled = true,
  minRating = 1,
  maxRating = 5,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      if (!enabled) return;

      // Skip if focus is in an input field
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.isContentEditable;

      if (isInputFocused) return;

      // Number keys 1-5 for rating
      if (onRatingChange && e.key >= "1" && e.key <= "5") {
        const rating = parseInt(e.key, 10);
        if (rating >= minRating && rating <= maxRating) {
          onRatingChange(rating);
        }
        return;
      }

      // Enter or Space for next/confirm
      if ((e.key === "Enter" || e.key === " ") && onNext) {
        e.preventDefault();
        onNext();
        return;
      }

      // Backspace for undo
      if (e.key === "Backspace" && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Arrow keys for pairwise selection
      if (e.key === "ArrowLeft" && onSelectLeft) {
        e.preventDefault();
        onSelectLeft();
        return;
      }

      if (e.key === "ArrowRight" && onSelectRight) {
        e.preventDefault();
        onSelectRight();
        return;
      }
    },
    [enabled, onRatingChange, onNext, onUndo, onSelectLeft, onSelectRight, minRating, maxRating]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}
