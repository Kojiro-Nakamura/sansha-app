// 3. Pure Logic & Geometry Utilities
// ==========================================
export const getSvgPathFromPoints = (points, isCurve) => {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (!isCurve || points.length === 2) return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

  let d = `M ${points[0].x} ${points[0].y}`;
  const tension = 1;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2 === points.length ? i + 1 : i + 2];
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension, cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension, cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
};

export const getLogicalPoint = (cx, cy, camera, svgRect) => {
  if (!svgRect) return { x: 0, y: 0 };
  return { x: (cx - svgRect.left - camera.x) / camera.zoom, y: (cy - svgRect.top - camera.y) / camera.zoom };
};

export const getEdgeSnapPoint = (pt, edge, currentNodes) => {
  let snapX = pt.x, snapY = pt.y;
  if (edge) {
    const n1 = currentNodes.find(n => n.id === edge.source), n2 = currentNodes.find(n => n.id === edge.target);
    if (n1 && n2) {
      const dx = n2.x - n1.x, dy = n2.y - n1.y, lenSq = dx * dx + dy * dy;
      if (lenSq > 0) {
        const t = Math.max(0, Math.min(1, ((pt.x - n1.x) * dx + (pt.y - n1.y) * dy) / lenSq));
        snapX = n1.x + t * dx; snapY = n1.y + t * dy;
      }
    }
  }
  return { x: snapX, y: snapY };
};

export const computeFaces = (nodes, edges, fractionDigits) => {
  const newFaces = [];
  const edgeMap = new Map();
  edges.forEach(e => { edgeMap.set(`${e.source}-${e.target}`, e); edgeMap.set(`${e.target}-${e.source}`, e); });

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      for (let k = j + 1; k < nodes.length; k++) {
        const u = nodes[i].id, v = nodes[j].id, w = nodes[k].id;
        const e1 = edgeMap.get(`${u}-${v}`), e2 = edgeMap.get(`${v}-${w}`), e3 = edgeMap.get(`${w}-${u}`);
        if (e1 && e2 && e3) {
          let area = null, status = 'missing_length';
          const a = e1.length, b = e2.length, c = e3.length;
          
          if (a !== null && b !== null && c !== null) {
            const epsilon = 1e-4; 
            if (a + b > c + epsilon && b + c > a + epsilon && c + a > b + epsilon) {
              const s = (a + b + c) / 2;
              const rawArea = Math.sqrt(Math.max(0, s * (s - a) * (s - b) * (s - c)));
              const multiplier = Math.pow(10, fractionDigits);
              area = Math.round(rawArea * multiplier) / multiplier;
              status = 'valid';
            } else if (Math.abs(a + b - c) <= epsilon || Math.abs(b + c - a) <= epsilon || Math.abs(c + a - b) <= epsilon) {
              continue; 
            } else {
              status = 'invalid_triangle';
            }
          }
          const sortedIds = [u, v, w].sort();
          newFaces.push({ id: `face-${sortedIds[0]}-${sortedIds[1]}-${sortedIds[2]}`, nodes: [nodes[i], nodes[j], nodes[k]], edges: [e1, e2, e3], area, status });
        }
      }
    }
  }
  return newFaces;
};

export const computeFacesWithNumbers = (faces, faceTypes) => {
  const counters = {};
  return faces.map(face => {
    let number = null;
    if (face.status === 'valid') {
      const typeId = faceTypes[face.id] || 't1';
      counters[typeId] = (counters[typeId] || 0) + 1;
      number = counters[typeId];
    }
    return { ...face, number };
  });
};

export const getActiveMovableElements = (selectedIds, nodes, lines, texts, edges, faces) => {
  const nodeIds = new Set(), lineIds = new Set(), textIds = new Set();
  selectedIds.forEach(id => {
    if (nodes.find(n => n.id === id)) nodeIds.add(id);
    else if (lines.find(l => l.id === id)) lineIds.add(id);
    else if (texts.find(t => t.id === id)) textIds.add(id);
    else if (edges.find(e => e.id === id)) {
      const eObj = edges.find(e => e.id === id);
      nodeIds.add(eObj.source); nodeIds.add(eObj.target);
    }
    else if (faces.find(f => f.id === id)) {
      const fObj = faces.find(f => f.id === id);
      fObj.nodes.forEach(n => nodeIds.add(n.id));
    }
  });
  return { nodeIds, lineIds, textIds };
};

export const getSelectionBoundingBox = (nodes, lines, texts, elementsToMove) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasItem = false;
  const updateBBox = (x, y) => { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); hasItem = true; };

  nodes.forEach(n => { if (elementsToMove.nodeIds.has(n.id)) updateBBox(n.x, n.y); });
  lines.forEach(l => { if (elementsToMove.lineIds.has(l.id)) l.points.forEach(p => updateBBox(p.x, p.y)); });
  texts.forEach(t => { if (elementsToMove.textIds.has(t.id)) updateBBox(t.x, t.y); });

  if (!hasItem) return null;
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY, cx: (minX + maxX)/2, cy: (minY + maxY)/2 };
};

export const calculateDisplayBoundingBox = (nodes, lines, texts, edges, facesWithNumbers) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasItem = false;
  const updateBBox = (x, y) => { minX=Math.min(minX,x); minY=Math.min(minY,y); maxX=Math.max(maxX,x); maxY=Math.max(maxY,y); hasItem = true; };

  nodes.forEach(n => {
    updateBBox(n.x, n.y);
    updateBBox(n.x - 15, n.y - 15); 
    updateBBox(n.x + 15, n.y + 15);
  });
  
  lines.forEach(l => {
    l.points.forEach(p => {
      updateBBox(p.x, p.y);
      if (l.isCurve) {
        updateBBox(p.x - 50, p.y - 50);
        updateBBox(p.x + 50, p.y + 50);
      }
    });
  });
  
  texts.forEach(t => {
    updateBBox(t.x, t.y);
    updateBBox(t.x - 60, t.y - 30);
    updateBBox(t.x + 60, t.y + 30);
  });
  
  if (edges && facesWithNumbers) {
    edges.forEach(edge => {
      const n1 = nodes.find(n => n.id === edge.source), n2 = nodes.find(n => n.id === edge.target);
      if (!n1 || !n2) return;
      const cx = (n1.x + n2.x) / 2, cy = (n1.y + n2.y) / 2, dx = n2.x - n1.x, dy = n2.y - n1.y, len = Math.hypot(dx, dy);
      let targetX = cx, targetY = cy, hasTarget = false, offsetX = 0, offsetY = -14;
      const adjFace = facesWithNumbers.find(f => f.edges.some(e => e?.id === edge.id));
      if (adjFace) { targetX = adjFace.nodes.reduce((s, n) => s + n.x, 0) / 3; targetY = adjFace.nodes.reduce((s, n) => s + n.y, 0) / 3; hasTarget = true; }
      if (len > 0) {
        let nx = -dy / len, ny = dx / len;
        if (hasTarget && nx * (targetX - cx) + ny * (targetY - cy) < 0) { nx = -nx; ny = -ny; } else if (!hasTarget && ny > 0) { nx = -nx; ny = -ny; }
        offsetX = nx * 14; offsetY = ny * 14;
      }
      updateBBox(cx + offsetX - 40, cy + offsetY - 25);
      updateBBox(cx + offsetX + 40, cy + offsetY + 25);
    });
  }

  if (!hasItem) return null;
  return { minX, minY, maxX, maxY, w: Math.max(1, maxX - minX), h: Math.max(1, maxY - minY) };
};

// ==========================================