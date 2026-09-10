export const createHoverProps = (id, type, isDragging, setHoveredTarget) => ({
  onPointerEnter: () => !isDragging && setHoveredTarget({ id, type }),
  onPointerLeave: () => !isDragging && setHoveredTarget(p => (p.id === id && p.type === type) ? { id: null, type: null } : p)
});
