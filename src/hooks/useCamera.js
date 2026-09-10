import { useState, useCallback } from 'react';
import * as Geometry from '../utils/geometry.js';

export function useCamera(svgRef, defaultCamera = { x: 0, y: 0, zoom: 1 }) {
  const [camera, setCamera] = useState(defaultCamera);

  const handleFitToView = useCallback((nodes, lines, texts, edges, facesWithNumbers) => {
    const bbox = Geometry.calculateDisplayBoundingBox(nodes, lines, texts, edges, facesWithNumbers);
    if (!bbox) return setCamera({ x: 0, y: 0, zoom: 1 });

    const { minX, minY, w, h } = bbox;
    const rect = svgRef.current ? svgRef.current.getBoundingClientRect() : { width: window.innerWidth - 384, height: window.innerHeight };
    const zoom = Math.min((rect.width - 60) / w, (rect.height - 60) / h, 2);
    setCamera({ x: rect.width / 2 - (minX + w / 2) * zoom, y: rect.height / 2 - (minY + h / 2) * zoom, zoom });
  }, [svgRef]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect(), mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1, newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.1), 10);
    const logicalX = (mouseX - camera.x) / camera.zoom, logicalY = (mouseY - camera.y) / camera.zoom;
    setCamera({ x: mouseX - logicalX * newZoom, y: mouseY - logicalY * newZoom, zoom: newZoom });
  }, [camera, svgRef]);

  return { camera, setCamera, handleFitToView, handleWheel };
}
