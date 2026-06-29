'use client';

import { useRef, useState, useCallback } from 'react';

/** A small reorder helper built on Pointer Events rather than the native
 *  HTML5 drag-and-drop API. Native `draggable` only fires for mouse input
 *  on most mobile browsers, so it silently does nothing on touch — pointer
 *  events fire consistently for mouse, touch, and pen, which is why this
 *  exists instead of just using `draggable`.
 *
 *  Usage: call useReorderable() once per list, then spread
 *  `getHandleProps(id)` onto a drag-handle element for each row. The list
 *  reorders live as the row is dragged, and onReorder fires once with the
 *  final order when the pointer is released. */
export function useReorderable<T extends { id: number }>(
  items: T[],
  onReorder: (orderedIds: number[]) => void
) {
  const [order, setOrder] = useState<T[]>(items);
  const draggingId = useRef<number | null>(null);
  const lastItemsRef = useRef(items);

  // Keep local order in sync when the parent's items change for reasons
  // other than our own reordering (e.g. a new item was added).
  if (lastItemsRef.current !== items) {
    lastItemsRef.current = items;
    setOrder(items);
  }

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const id = draggingId.current;
      if (id === null) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const row = target?.closest('[data-reorder-id]') as HTMLElement | null;
      if (!row) return;
      const overId = Number(row.dataset.reorderId);
      if (!Number.isFinite(overId) || overId === id) return;

      setOrder((prev) => {
        const fromIdx = prev.findIndex((i) => i.id === id);
        const toIdx = prev.findIndex((i) => i.id === overId);
        if (fromIdx === -1 || toIdx === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    draggingId.current = null;
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.body.style.userSelect = '';
    setOrder((current) => {
      onReorder(current.map((i) => i.id));
      return current;
    });
  }, [handlePointerMove, onReorder]);

  function getHandleProps(id: number) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        // Avoid hijacking multi-touch gestures like pinch-zoom.
        if (e.pointerType === 'touch' && e.isPrimary === false) return;
        draggingId.current = id;
        document.body.style.userSelect = 'none';
        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);
      },
      style: { touchAction: 'none' as const, cursor: 'grab' },
    };
  }

  function getRowProps(id: number) {
    return { 'data-reorder-id': id };
  }

  return { order, getHandleProps, getRowProps };
}
