import { useRef, useState, useCallback } from "react";

/**
 * Converts a pointer-drag distance in on-screen pixels into an equivalent
 * distance in the SVG's own viewBox units, using the current rendered size
 * of the <svg> element. This is what makes dragging feel 1:1 regardless of
 * how large the preview is rendered on screen.
 */
export function useDragToReposition(svgRef, offset, onOffsetChange, enabled = true) {
  const dragState = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragState.current || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const viewBox = svgRef.current.viewBox.baseVal;
      const scaleX = viewBox.width / rect.width;
      const scaleY = viewBox.height / rect.height;
      const dx = (e.clientX - dragState.current.startClientX) * scaleX;
      const dy = (e.clientY - dragState.current.startClientY) * scaleY;
      onOffsetChange({
        x: dragState.current.startOffsetX + dx,
        y: dragState.current.startOffsetY + dy,
      });
    },
    [svgRef, onOffsetChange]
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
    setIsDragging(false);
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
  }, [handlePointerMove]);

  const handlePointerDown = useCallback(
    (e) => {
      if (!enabled) return;
      e.preventDefault();
      dragState.current = {
        startClientX: e.clientX,
        startClientY: e.clientY,
        startOffsetX: offset.x,
        startOffsetY: offset.y,
      };
      setIsDragging(true);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [enabled, offset, handlePointerMove, handlePointerUp]
  );

  return { handlePointerDown, isDragging };
}
