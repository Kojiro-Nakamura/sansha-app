import { defaultSlopeTypes, defaultAttributes } from '../constants/defaults.js';
import { calculateDisplayBoundingBox, getSvgPathFromPoints } from './geometry.js';

// 5. HTML Export Utility
// ==========================================
export const exportToHTML = (printOptions, drawData) => {
  const { size, orientation, colorMode, tableRowsLimit, scale, showAreaInPolygon, fontSizeMultiplier = 1.0, edgeTextOffset = 14 } = printOptions;
  const { nodes, edges, lines, texts, faceTypes, faceDeductions, slopeTypes, fractionDigits, attributes, facesWithNumbers, totalArea } = drawData;

  const bbox = calculateDisplayBoundingBox(nodes, lines, texts, edges, facesWithNumbers);
  let minX = 0, minY = 0, w = 100, h = 100;
  if (bbox) { minX = bbox.minX; minY = bbox.minY; w = bbox.w; h = bbox.h; }
  
  const pad = Math.max(w, h) * 0.03; 
  const vbMinX = minX - pad, vbMinY = minY - pad, vbW = w + pad*2, vbH = h + pad*2;

  let svgWidthStyle = '100%', svgHeightStyle = '100%';
  let svgMaxWidthStyle = '100%', svgMaxHeightStyle = '100%', svgFlexShrink = '1';
  let drawingWidthStyle = '60%', drawingHeightStyle = '80%';
  
  let realLenSum = 0, svgLenSum = 0;
  edges.forEach(e => {
    if (e.length > 0) {
      const n1 = nodes.find(n => n.id === e.source), n2 = nodes.find(n => n.id === e.target);
      if (n1 && n2) { realLenSum += e.length; svgLenSum += Math.hypot(n1.x - n2.x, n1.y - n2.y); }
    }
  });
  const pxPerMeter = realLenSum > 0 ? svgLenSum / realLenSum : 0;

  if (scale !== 'auto') {
    const numScale = parseInt(scale, 10);
    if (pxPerMeter > 0) {
      const mmPerPx = (1000 / numScale) / pxPerMeter;
      svgWidthStyle = `${vbW * mmPerPx}mm`; svgHeightStyle = `${vbH * mmPerPx}mm`;
      svgMaxWidthStyle = 'none'; svgMaxHeightStyle = 'none'; svgFlexShrink = '0';
      drawingWidthStyle = svgWidthStyle;
      drawingHeightStyle = svgHeightStyle;
    }
  }

  const titleHTML = `<div class="draggable title-container" style="top: 15mm; left: 40%; z-index: 10;"><div style="font-size: 1em; font-weight: bold; letter-spacing: 0.2em; border-bottom: 3px solid currentColor; display: inline-block; padding: 0 10px 5px 10px;">展開図</div><div class="resize-handle no-print"></div></div>`;
  const scaleLabelHTML = `<div class="draggable scale-container" id="scale-label-container" style="bottom: 20mm; right: 20mm; z-index: 10; display: ${scale === 'auto' ? 'none' : 'block'};">縮尺: 1/${scale}</div>`;

  const attributesRowsHTML = attributes.filter(a => a.key || a.value).map(attr => `<tr><th style="text-align: left; width: 30%; background-color: #f8fafc; padding: 5px 10px; border: 1px solid #333;">${attr.key}</th><td style="text-align: left; padding: 5px 10px; border: 1px solid #333;">${attr.value}</td></tr>`).join('');
  const attributesHTML = attributesRowsHTML ? `<div class="draggable attributes-container" style="top: 20mm; left: 20mm; z-index: 10;"><table style="width: 100%; border: 2px solid #333; margin: 0; background-color: white; border-collapse: collapse;">${attributesRowsHTML}</table><div class="resize-handle no-print"></div></div>` : '';

  let defsHTML = `<defs>
    <mask id="deduction-mask-print">
      <rect x="-100000" y="-100000" width="200000" height="200000" fill="white" />`;
  facesWithNumbers.forEach(face => {
    if (faceDeductions[face.id] && face.status === 'valid') {
      const pts = face.nodes.map(n => `${n.x},${n.y}`).join(' ');
      defsHTML += `<polygon points="${pts}" fill="black" />`;
    }
  });
  defsHTML += `</mask>
    <pattern id="deduct-pattern-print" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" stroke-width="1.5" opacity="0.6" />
    </pattern>
  </defs>`;

  let svgContent = `<svg viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" style="width: ${svgWidthStyle}; height: ${svgHeightStyle}; max-width: ${svgMaxWidthStyle}; max-height: ${svgMaxHeightStyle}; flex-shrink: ${svgFlexShrink}; font-family: sans-serif; display: block;" xmlns="http://www.w3.org/2000/svg">
    ${defsHTML}`;

  facesWithNumbers.forEach(face => {
    const pts = face.nodes.map(n => `${n.x},${n.y}`).join(' '), typeId = faceTypes[face.id] || 't1', sType = slopeTypes.find(t => t.id === typeId) || slopeTypes[0] || defaultSlopeTypes[0];
    const displayName = `${sType.shortName || sType.name.charAt(0)}${face.number}`;
    const cx = face.nodes.reduce((s, n) => s + n.x, 0) / 3, cy = face.nodes.reduce((s, n) => s + n.y, 0) / 3;
    const isDeduct = faceDeductions[face.id];

    let fill = sType.color, fillOpacity = 0.4, stroke = "transparent", strokeW = 0, dashArray = "none";
    if (isDeduct) { fill = "url(#deduct-pattern-print)"; fillOpacity = 1; stroke = sType.color; strokeW = 2; dashArray = "4 4"; }

    if (face.status === 'invalid_triangle') { fill = "#e11d48"; fillOpacity = 0.2; stroke = "transparent"; dashArray = "none"; }
    else if (face.status === 'missing_length') { fillOpacity = 0.1; stroke = sType.color; strokeW = 2; dashArray = "8 6"; }

    let maskAttr = (!isDeduct && face.status === 'valid') ? `mask="url(#deduction-mask-print)"` : "";

    svgContent += `<polygon points="${pts}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="${dashArray}" stroke-linejoin="round" ${maskAttr} />`;

    if (face.status === 'valid') {
      const areaStr = face.area !== null ? (isDeduct ? `-${face.area.toFixed(fractionDigits)}` : face.area.toFixed(fractionDigits)) : '';
      const nameY = showAreaInPolygon ? -5 * fontSizeMultiplier : 0;
      svgContent += `<g class="svg-draggable" style="cursor: move; pointer-events: all; user-select: none;" transform="translate(0,0)">
        <g class="face-text-group" transform="translate(${cx}, ${cy})">
          <text class="text-outline dynamic-text face-name" data-base-size="6" data-base-stroke="1.5" data-base-y="-5" y="${nameY}" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${1.5 * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${6 * fontSizeMultiplier}" font-weight="bold" opacity="0.9">${displayName}</text>
          <text class="dynamic-text face-name" data-base-size="6" data-base-y="-5" y="${nameY}" dominant-baseline="middle" text-anchor="middle" fill="#1e293b" font-size="${6 * fontSizeMultiplier}" font-weight="bold">${displayName}</text>
          <g class="face-area-group" style="display: ${showAreaInPolygon ? 'block' : 'none'}">
            <text class="text-outline dynamic-text face-area" data-base-size="7" data-base-stroke="2" data-base-y="3" y="${3 * fontSizeMultiplier}" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${2 * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${7 * fontSizeMultiplier}" font-weight="bold" opacity="0.9">${areaStr}㎡</text>
            <text class="dynamic-text face-area" data-base-size="7" data-base-y="3" y="${3 * fontSizeMultiplier}" dominant-baseline="middle" text-anchor="middle" fill="#1e293b" font-size="${7 * fontSizeMultiplier}" font-weight="bold">${areaStr}㎡</text>
          </g>
        </g>
      </g>`;
    } else if (face.status === 'missing_length') {
      const nameY = showAreaInPolygon ? -5 * fontSizeMultiplier : 0;
      svgContent += `<g class="svg-draggable" style="cursor: move; pointer-events: all; user-select: none;" transform="translate(0,0)">
        <g class="face-text-group" transform="translate(${cx}, ${cy})">
          <text class="text-outline dynamic-text face-name" data-base-size="6" data-base-stroke="1.5" data-base-y="-5" y="${nameY}" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${1.5 * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${6 * fontSizeMultiplier}" font-weight="bold" opacity="0.7">${displayName}</text>
          <text class="dynamic-text face-name" data-base-size="6" data-base-y="-5" y="${nameY}" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="${6 * fontSizeMultiplier}" font-weight="bold">${displayName}</text>
          <g class="face-area-group" style="display: ${showAreaInPolygon ? 'block' : 'none'}">
            <text class="text-outline dynamic-text face-area" data-base-size="7" data-base-stroke="2" data-base-y="3" y="${3 * fontSizeMultiplier}" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${2 * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${7 * fontSizeMultiplier}" font-weight="bold" opacity="0.7">? ㎡</text>
            <text class="dynamic-text face-area" data-base-size="7" data-base-y="3" y="${3 * fontSizeMultiplier}" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="${7 * fontSizeMultiplier}" font-weight="bold">? ㎡</text>
          </g>
        </g>
      </g>`;
    } else {
      svgContent += `<g class="svg-draggable" style="cursor: move; pointer-events: all; user-select: none;" transform="translate(0,0)">
        <g class="face-text-group" transform="translate(${cx}, ${cy})">
          <text class="dynamic-text invalid-mark" data-base-size="10" data-base-y="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="#e11d48" font-size="${10 * fontSizeMultiplier}" font-weight="bold">!</text>
        </g>
      </g>`;
    }
  });

  edges.forEach(edge => {
    const n1 = nodes.find(n => n.id === edge.source), n2 = nodes.find(n => n.id === edge.target);
    if (!n1 || !n2) return;
    const cx = (n1.x + n2.x) / 2, cy = (n1.y + n2.y) / 2, dx = n2.x - n1.x, dy = n2.y - n1.y, len = Math.hypot(dx, dy), hasLength = edge.length !== null;
    let targetX = cx, targetY = cy, hasTarget = false, offsetX = 0, offsetY = 0, nx = 0, ny = -1; 
    const adjFace = facesWithNumbers.find(f => f.edges.some(e => e?.id === edge.id));
    if (adjFace) { targetX = adjFace.nodes.reduce((s, n) => s + n.x, 0) / 3; targetY = adjFace.nodes.reduce((s, n) => s + n.y, 0) / 3; hasTarget = true; }
    if (len > 0) {
      nx = -dy / len; ny = dx / len;
      if (hasTarget && nx * (targetX - cx) + ny * (targetY - cy) < 0) { nx = -nx; ny = -ny; } else if (!hasTarget && ny > 0) { nx = -nx; ny = -ny; }
      offsetX = nx * edgeTextOffset; offsetY = ny * edgeTextOffset; 
    }
    let angle = Math.atan2(dy, dx) * (180 / Math.PI); if (angle > 90 || angle < -90) angle += 180;
    const lengthText = hasLength ? Number(edge.length).toFixed(fractionDigits) : '?';
    svgContent += `<line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" stroke="${hasLength ? '#334155' : '#e11d48'}" stroke-width="2" stroke-dasharray="${hasLength ? 'none' : '4 4'}" />`;
    
    svgContent += `<g class="svg-draggable" style="cursor: move; pointer-events: all; user-select: none;" transform="translate(0,0)">
      <g class="edge-text-group" transform="translate(${cx + offsetX}, ${cy + offsetY}) rotate(${angle})" data-cx="${cx}" data-cy="${cy}" data-nx="${nx}" data-ny="${ny}" data-angle="${angle}">
        <text class="text-outline dynamic-text edge-text" data-base-size="8" data-base-stroke="2" data-base-y="0" y="0" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${2 * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${8 * fontSizeMultiplier}" font-weight="bold">${lengthText}</text>
        <text class="dynamic-text edge-text" data-base-size="8" data-base-y="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="${hasLength ? '#1e293b' : '#e11d48'}" font-size="${8 * fontSizeMultiplier}" font-weight="bold">${lengthText}</text>
      </g>
    </g>`;
  });

  lines.forEach(line => {
    const d = getSvgPathFromPoints(line.points, line.isCurve);
    svgContent += `<path d="${d}" fill="none" stroke="${line.color}" stroke-width="${line.strokeWidth}" stroke-dasharray="${line.strokeDasharray}" stroke-linecap="round" stroke-linejoin="round" />`;
  });
  texts.forEach(text => {
    const strokeW = Math.max(1.5, text.fontSize * 0.25);
    svgContent += `<g class="svg-draggable" style="cursor: move; pointer-events: all; user-select: none;" transform="translate(0,0)"><g transform="translate(${text.x}, ${text.y}) rotate(${text.rotation || 0})">
      <text class="text-outline dynamic-text custom-text" data-base-size="${text.fontSize}" data-base-stroke="${strokeW}" data-base-y="0" y="0" dominant-baseline="middle" text-anchor="middle" stroke="white" stroke-width="${strokeW * fontSizeMultiplier}" stroke-linejoin="round" fill="none" font-size="${text.fontSize * fontSizeMultiplier}" font-weight="bold" opacity="0.9">${text.text}</text>
      <text class="dynamic-text custom-text" data-base-size="${text.fontSize}" data-base-y="0" y="0" dominant-baseline="middle" text-anchor="middle" fill="${text.color}" font-size="${text.fontSize * fontSizeMultiplier}" font-weight="bold">${text.text}</text>
    </g></g>`;
  });

  svgContent += `</svg>`;

  const rawTableData = slopeTypes.map(type => {
    const typeFaces = facesWithNumbers.filter(f => f.status === 'valid' && (faceTypes[f.id] || 't1') === type.id);
    if (typeFaces.length === 0) return null;
    const parentFaces = typeFaces.filter(f => !faceDeductions[f.id]);
    const deductFaces = typeFaces.filter(f => faceDeductions[f.id]);
    return {
      id: type.id, name: type.name, color: type.color, shortName: type.shortName || type.name.charAt(0),
      faces: typeFaces.map(f => {
        const isDeduct = !!faceDeductions[f.id];
        return {
           id: f.id,
           displayName: isDeduct ? `(控除)${type.shortName || type.name.charAt(0)}${f.number}` : `${type.shortName || type.name.charAt(0)}${f.number}`,
           edges: [f.edges[0]?.length||0, f.edges[1]?.length||0, f.edges[2]?.length||0],
           area: f.area, isDeduct
        };
      }),
      parentTotal: parentFaces.reduce((sum, f) => sum + f.area, 0),
      deductTotal: deductFaces.reduce((sum, f) => sum + f.area, 0),
      netTotal: parentFaces.reduce((sum, f) => sum + f.area, 0) - deductFaces.reduce((sum, f) => sum + f.area, 0)
    };
  }).filter(Boolean);

  const baseFontSize = size === 'A1' ? 24 : (size === 'A3' ? 16 : 12); 
  const baseTableWidth = size === 'A1' ? 800 : (size === 'A3' ? 500 : 400);

  // 初期の用紙サイズを計算
  const initialPageWidth = size === 'A1' ? (orientation === 'landscape' ? '841mm' : '594mm') : size === 'A3' ? (orientation === 'landscape' ? '420mm' : '297mm') : (orientation === 'landscape' ? '297mm' : '210mm');
  const initialPageHeight = size === 'A1' ? (orientation === 'landscape' ? '594mm' : '841mm') : size === 'A3' ? (orientation === 'landscape' ? '297mm' : '420mm') : (orientation === 'landscape' ? '210mm' : '297mm');

  const html = `<!DOCTYPE html>
<html lang="ja"><head><meta charset="UTF-8"><title>三斜求積図 印刷プレビュー</title>
<meta name="google" content="notranslate">
<style id="dynamic-page-style">
@page { size: ${size} ${orientation}; margin: 0; }
</style>
<style>
.page-wrapper {
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  transform-origin: center center;
}

body { font-family: 'Noto Sans JP', sans-serif; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #e2e8f0; }
.page { width: ${initialPageWidth}; height: ${initialPageHeight}; background-color: white; margin: 0 auto; position: relative; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); box-sizing: border-box; overflow: hidden; }
.draggable { position: absolute; cursor: move; border: 1px dashed transparent; user-select: none; -webkit-user-select: none; touch-action: none; } .draggable:hover { border: 1px dashed #cbd5e1; }
.drawing { width: 60%; height: 80%; top: 10mm; left: 10mm; display: flex; align-items: center; justify-content: center; background-color: transparent; }

/* ポリゴンや線はクリックを透過させ、文字だけをドラッグ可能にする */
.drawing svg polygon, .drawing svg line, .drawing svg path { pointer-events: none; }
.drawing svg .svg-draggable { pointer-events: all; }

.scale-container, .title-container, .table-container, .attributes-container { color: #1e293b; background-color: transparent; white-space: nowrap; } .scale-container { font-weight: bold; padding: 5px 10px; }
.resize-handle { width: 15px; height: 15px; background-color: #3b82f6; position: absolute; right: 0; bottom: 0; cursor: nwse-resize; display: none; opacity: 0.8; } .draggable:hover .resize-handle { display: block; }
table { width: 100%; border-collapse: collapse; margin-bottom: 10px; background-color: white; } th, td { border: 1px solid #333; padding: 0.3em; text-align: center; } th { background-color: #f1f5f9; } .title { font-size: 1.5em; font-weight: bold; margin-bottom: 10px; text-align: center; }
/* 白黒設定時にも白フチの視認性を確保するためのCSSを調整 */
body.bw-mode svg polygon { fill: transparent !important; stroke: #111 !important; stroke-width: 2 !important; }
body.bw-mode svg path, body.bw-mode svg polyline, body.bw-mode svg line { stroke: #111 !important; }
body.bw-mode svg text { fill: #111 !important; stroke: none !important; }
body.bw-mode svg text.text-outline { fill: none !important; stroke: white !important; }
body.bw-mode th { background-color: #fff !important; }
body.bw-mode .scale-container, body.bw-mode .title-container { color: #111 !important; }
@media print { 
  html, body { width: 100%; height: 100%; overflow: hidden; background-color: white; padding: 0 !important; margin: 0 !important; } 
  #scroll-spacer { height: 100% !important; display: block !important; } 
  .page-wrapper { transform: none !important; width: 100%; height: 100vh !important; display: flex; align-items: center; justify-content: center; } 
  .page { margin: 0 auto; padding: 0; box-shadow: none; border: none; width: 100%; height: 100%; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; } 
  .draggable { border: none !important; } 
  .resize-handle { display: none !important; } 
  .no-print { display: none !important; } 
}
</style></head>
<body class="${colorMode === 'bw' ? 'bw-mode' : ''}">
<div id="control-panel" class="no-print" style="position: fixed; top: 0; left: 0; width: 100%; background: rgba(30, 41, 59, 0.95); color: white; padding: 12px 24px; box-sizing: border-box; z-index: 1000; font-family: sans-serif; box-shadow: 0 4px 10px rgba(0,0,0,0.2); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; backdrop-filter: blur(4px);">
  <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
    <h3 style="margin: 0; font-size: 16px; font-weight: bold; display: flex; align-items: center; gap: 8px;">🖨️ プレビュー調整</h3>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">カラー</span>
      <select id="setting-colormode" onchange="updateColorMode()" style="font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; cursor:pointer;">
        <option value="color" ${colorMode==='color'?'selected':''}>カラー</option>
        <option value="bw" ${colorMode==='bw'?'selected':''}>白黒線画</option>
      </select>
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">用紙</span>
      <select id="setting-size" onchange="updatePageStyle()" style="font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; cursor:pointer;">
        <option value="A4" ${size==='A4'?'selected':''}>A4</option>
        <option value="A3" ${size==='A3'?'selected':''}>A3</option>
        <option value="A1" ${size==='A1'?'selected':''}>A1</option>
      </select>
      <select id="setting-orientation" onchange="updatePageStyle()" style="font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; cursor:pointer;">
        <option value="landscape" ${orientation==='landscape'?'selected':''}>横向き</option>
        <option value="portrait" ${orientation==='portrait'?'selected':''}>縦向き</option>
      </select>
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">縮尺</span>
      <select id="setting-scale" onchange="updateScale()" style="font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; cursor:pointer;">
        <option value="auto" ${scale==='auto'?'selected':''}>自動</option>
        <option value="50" ${scale==='50'?'selected':''}>1/50</option>
        <option value="100" ${scale==='100'?'selected':''}>1/100</option>
        <option value="200" ${scale==='200'?'selected':''}>1/200</option>
        <option value="250" ${scale==='250'?'selected':''}>1/250</option>
        <option value="500" ${scale==='500'?'selected':''}>1/500</option>
        <option value="1000" ${scale==='1000'?'selected':''}>1/1000</option>
      </select>
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">文字倍率</span>
      <input type="number" id="setting-font-mult" value="${fontSizeMultiplier}" step="0.1" min="0.5" max="5.0" oninput="updateVisuals()" onchange="updateVisuals()" style="width:50px; font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; text-align:center;" />
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">寸法距離</span>
      <input type="number" id="setting-edge-offset" value="${edgeTextOffset}" step="1" min="0" max="100" oninput="updateVisuals()" onchange="updateVisuals()" style="width:50px; font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; text-align:center;" />
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <label style="font-size: 12px; font-weight: bold; color: #cbd5e1; display:flex; align-items:center; gap:4px; cursor:pointer;">
        <input type="checkbox" id="setting-show-area" ${showAreaInPolygon ? 'checked' : ''} onchange="updateVisuals()" style="cursor:pointer;" />
        面積表示
      </label>
    </div>
    <div style="display: flex; gap: 6px; align-items: center; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">表の行数</span>
      <input type="number" id="setting-table-rows" value="${tableRowsLimit}" onchange="renderTables()" min="1" style="width:50px; font-size:12px; padding:4px 6px; border-radius:4px; border:1px solid #475569; outline:none; background:#334155; color:white; text-align:center;" />
    </div>
  </div>
  <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
    <div style="display: flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 6px;">
      <span style="font-size: 12px; font-weight: bold; color: #cbd5e1;">表示倍率</span>
      <button onclick="changePageScale(-0.1)" style="background: #334155; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">-</button>
      <span id="scale-display" style="font-size: 13px; font-weight: bold; width: 40px; text-align: center;">100%</span>
      <button onclick="changePageScale(0.1)" style="background: #334155; color: white; border: none; border-radius: 4px; width: 24px; height: 24px; cursor: pointer; font-weight: bold; display: flex; align-items: center; justify-content: center;">+</button>
      <button onclick="fitToScreen()" style="background: #3b82f6; color: white; border: none; border-radius: 4px; padding: 0 8px; height: 24px; cursor: pointer; font-weight: bold; font-size: 11px; margin-left: 4px;" title="画面に合わせる">フィット</button>
    </div>
    <div style="display: flex; gap: 6px; align-items: center;">
      <input type="text" id="setting-filename" value="${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}_展開図レイアウト.html" style="width: 180px; font-size:13px; padding:8px 10px; border-radius:6px; border:1px solid #475569; outline:none; background:#334155; color:white;" placeholder="ファイル名" />
      <button onclick="saveAsHTML()" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background 0.2s;">HTML保存</button>
      <button onclick="window.print()" style="padding: 8px 24px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); transition: background 0.2s;">印刷する</button>
    </div>
  </div>
</div>
<div id="scroll-spacer" style="width: 100%; transition: height 0.15s ease-out; display: flex; flex-direction: column; justify-content: center;">
  <div class="page-wrapper" id="page-wrapper">
    <div class="page">${titleHTML}${attributesHTML}<div class="draggable drawing" id="drawing" style="z-index: 5; width: ${drawingWidthStyle}; height: ${drawingHeightStyle};">${svgContent}<div class="resize-handle no-print"></div></div>${scaleLabelHTML}</div>
  </div>
</div>
<script>
  let pageScale = 1.0;
  
  const svgVbW = ${vbW};
  const svgVbH = ${vbH};
  const pxPerMeter = ${pxPerMeter};
  const fractionDigits = ${fractionDigits};
  const rawTableData = ${JSON.stringify(rawTableData)};
  const totalArea = ${totalArea};
  
  let currentBaseTableFontSize = ${baseFontSize};
  let currentBaseTableWidth = ${baseTableWidth};

  function updateColorMode() {
    const mode = document.getElementById('setting-colormode').value;
    if (mode === 'bw') {
      document.body.classList.add('bw-mode');
    } else {
      document.body.classList.remove('bw-mode');
    }
  }

  function updateVisuals() {
    const fontMult = parseFloat(document.getElementById('setting-font-mult').value) || 1.0;
    const edgeOffset = parseFloat(document.getElementById('setting-edge-offset').value) || 0;
    const showArea = document.getElementById('setting-show-area').checked;

    document.querySelectorAll('.face-area-group').forEach(el => {
      el.style.display = showArea ? 'block' : 'none';
    });

    document.querySelectorAll('.dynamic-text').forEach(el => {
      const baseSize = parseFloat(el.getAttribute('data-base-size') || 10);
      const baseY = parseFloat(el.getAttribute('data-base-y') || 0);
      
      let adjustedY = baseY;
      if (el.classList.contains('face-name') && !showArea) {
         adjustedY = 0; 
      }

      el.setAttribute('font-size', baseSize * fontMult);
      el.setAttribute('y', adjustedY * fontMult);

      if (el.classList.contains('text-outline')) {
         const baseStroke = parseFloat(el.getAttribute('data-base-stroke'));
         if (!isNaN(baseStroke)) {
            el.setAttribute('stroke-width', baseStroke * fontMult);
         }
      }
    });

    document.querySelectorAll('.edge-text-group').forEach(group => {
      const cx = parseFloat(group.getAttribute('data-cx'));
      const cy = parseFloat(group.getAttribute('data-cy'));
      const nx = parseFloat(group.getAttribute('data-nx'));
      const ny = parseFloat(group.getAttribute('data-ny'));
      const angle = parseFloat(group.getAttribute('data-angle'));
      
      const offsetX = nx * edgeOffset;
      const offsetY = ny * edgeOffset;
      
      group.setAttribute('transform', \`translate(\${cx + offsetX}, \${cy + offsetY}) rotate(\${angle})\`);
    });
  }

  function updateScrollSpacer() {
    const page = document.querySelector('.page');
    const spacer = document.getElementById('scroll-spacer');
    const panel = document.getElementById('control-panel');
    if (page && spacer && panel) {
      const panelHeight = panel.offsetHeight;
      const scaledHeight = page.offsetHeight * pageScale;
      const availHeight = window.innerHeight - panelHeight;
      const requiredHeight = scaledHeight + 48; // 余白48px(上下24px)
      
      spacer.style.height = Math.max(availHeight, requiredHeight) + 'px';
    }
  }

  function updatePageStyle() {
    const size = document.getElementById('setting-size').value;
    const orientation = document.getElementById('setting-orientation').value;
    
    let w, h;
    if (size === 'A1') {
      w = orientation === 'landscape' ? '841mm' : '594mm';
      h = orientation === 'landscape' ? '594mm' : '841mm';
    } else if (size === 'A3') {
      w = orientation === 'landscape' ? '420mm' : '297mm';
      h = orientation === 'landscape' ? '297mm' : '420mm';
    } else {
      w = orientation === 'landscape' ? '297mm' : '210mm';
      h = orientation === 'landscape' ? '210mm' : '297mm';
    }
    
    const pageEl = document.querySelector('.page');
    if (pageEl) {
      pageEl.style.width = w;
      pageEl.style.height = h;
    }
    
    const styleEl = document.getElementById('dynamic-page-style');
    if (styleEl) {
      styleEl.textContent = \`@page { size: \${size} \${orientation}; margin: 0; }\`;
    }
    fitToScreen();
    setTimeout(updateScale, 10);
  }

  function updateScale() {
    const scaleValue = document.getElementById('setting-scale').value;
    const drawingEl = document.getElementById('drawing');
    const svgEl = drawingEl.querySelector('svg');
    const scaleLabelContainer = document.getElementById('scale-label-container');
    const pageEl = document.querySelector('.page');
    
    if (scaleValue === 'auto') {
      drawingEl.style.overflow = 'hidden';
      svgEl.style.width = '100%';
      svgEl.style.height = '100%';
      svgEl.style.maxWidth = '100%';
      svgEl.style.maxHeight = '100%';
      svgEl.style.flexShrink = '1';
      
      if (pageEl) {
        drawingEl.style.width = (pageEl.offsetWidth * 0.6) + 'px';
        drawingEl.style.height = (pageEl.offsetHeight * 0.8) + 'px';
      } else {
        drawingEl.style.width = '60%';
        drawingEl.style.height = '80%';
      }
      
      if (scaleLabelContainer) scaleLabelContainer.style.display = 'none';
    } else {
      drawingEl.style.overflow = 'visible';
      const numScale = parseInt(scaleValue, 10);
      if (pxPerMeter > 0) {
        const mmPerPx = (1000 / numScale) / pxPerMeter;
        const newW = \`\${svgVbW * mmPerPx}mm\`;
        const newH = \`\${svgVbH * mmPerPx}mm\`;
        svgEl.style.width = newW;
        svgEl.style.height = newH;
        svgEl.style.maxWidth = 'none';
        svgEl.style.maxHeight = 'none';
        svgEl.style.flexShrink = '0';
        drawingEl.style.width = newW;
        drawingEl.style.height = newH;
      }
      if (scaleLabelContainer) {
        scaleLabelContainer.style.display = 'block';
        scaleLabelContainer.innerText = \`縮尺: 1/\${scaleValue}\`;
      }
    }
    updateScrollSpacer();
  }

  function renderTables() {
    const limitInput = document.getElementById('setting-table-rows');
    let limit = parseInt(limitInput.value, 10);
    if (isNaN(limit) || limit < 1) limit = 50;

    document.querySelectorAll('.table-container').forEach(el => el.remove());
    
    const pageEl = document.querySelector('.page');
    let tableIndex = 0;
    
    rawTableData.forEach(type => {
      const combinedFaces = type.faces;
      const chunks = [];
      for (let i = 0; i < combinedFaces.length; i += limit) {
        chunks.push(combinedFaces.slice(i, i + limit));
      }
      
      const deductCount = combinedFaces.filter(f => f.isDeduct).length;
      
      chunks.forEach((chunk, chunkIdx) => {
        let singleTableHTML = \`<div class="title">\${type.name} 計算書\${chunks.length > 1 ? \` (\${chunkIdx + 1}/\${chunks.length})\` : ''}</div><table><tr><th colspan="5" style="text-align:left; background-color:\${type.color}30;">\${type.name}\${deductCount > 0 ? ' (控除含む)' : ''}</th></tr><tr><th width="20%">番号</th><th width="20%">辺a (m)</th><th width="20%">辺b (m)</th><th width="20%">辺c (m)</th><th width="20%">面積(㎡)</th></tr>\`;
        
        chunk.forEach(f => {
          const faceAreaStr = f.isDeduct ? \`-\${f.area.toFixed(fractionDigits)}\` : f.area.toFixed(fractionDigits);
          singleTableHTML += \`<tr><td>\${f.displayName}</td><td>\${f.edges[0].toFixed(fractionDigits)}</td><td>\${f.edges[1].toFixed(fractionDigits)}</td><td>\${f.edges[2].toFixed(fractionDigits)}</td><td style="color:\${f.isDeduct ? '#e11d48' : 'inherit'};">\${faceAreaStr}</td></tr>\`;
        });
        
        if (chunkIdx === chunks.length - 1) {
          if (deductCount > 0) {
            singleTableHTML += \`<tr><td colspan="4" style="text-align:right; background-color:#f8fafc;">小計</td><td style="background-color:#f8fafc;">\${type.parentTotal.toFixed(fractionDigits)}</td></tr>\`;
            singleTableHTML += \`<tr><td colspan="4" style="text-align:right; background-color:#fef2f2; color:#e11d48;">控除合計</td><td style="background-color:#fef2f2; color:#e11d48;">-\${type.deductTotal.toFixed(fractionDigits)}</td></tr>\`;
          }
          singleTableHTML += \`<tr><td colspan="4" style="text-align:right; font-weight:bold; background-color:#f1f5f9;">\${deductCount > 0 ? '差引合計' : '合計'}</td><td style="font-weight:bold; background-color:#f1f5f9;">\${type.netTotal.toFixed(fractionDigits)}</td></tr>\`;
        }
        singleTableHTML += \`</table>\`;
        
        const div = document.createElement('div');
        div.className = 'draggable table-container';
        div.id = \`table-\${type.id}-\${chunkIdx}\`;
        div.style.top = (40 + tableIndex * 30) + 'px';
        div.style.right = (40 - tableIndex * 30) + 'px';
        div.style.zIndex = 10;
        div.innerHTML = singleTableHTML + \`<div class="resize-handle no-print"></div>\`;
        
        pageEl.appendChild(div);
        setupWheelForElement(div, currentBaseTableWidth, currentBaseTableFontSize);
        tableIndex++;
      });
    });
    
    const totalDiv = document.createElement('div');
    totalDiv.className = 'draggable table-container';
    totalDiv.id = 'table-total';
    totalDiv.style.top = (40 + tableIndex * 30) + 'px';
    totalDiv.style.right = (40 - tableIndex * 30) + 'px';
    totalDiv.style.zIndex = 10;
    totalDiv.innerHTML = \`<div class="title">総面積</div><table style="border:2px solid #333;"><tr><td width="80%" style="text-align:right; font-weight:bold; background-color:#f1f5f9;">総面積</td><td width="20%" style="font-weight:bold; background-color:#f1f5f9; text-align:center;">\${totalArea.toFixed(fractionDigits)} ㎡</td></tr></table><div class="resize-handle no-print"></div>\`;
    pageEl.appendChild(totalDiv);
    setupWheelForElement(totalDiv, currentBaseTableWidth, currentBaseTableFontSize);
  }

  function changePageScale(delta, clientX, clientY) {
    const oldScale = pageScale;
    pageScale = Math.max(0.1, Math.min(3.0, pageScale + delta));
    const ratio = pageScale / oldScale;
    const wrapper = document.getElementById('page-wrapper');
    const panel = document.getElementById('control-panel');
    
    if (panel) document.body.style.paddingTop = panel.offsetHeight + 'px';
    
    if (clientX !== undefined && clientY !== undefined) {
      const rect = wrapper.getBoundingClientRect();
      const newWidth = rect.width * ratio;
      const newLeft = rect.left - (newWidth - rect.width) / 2;
      const newTop = rect.top;
      
      const relX = clientX - rect.left;
      const relY = clientY - rect.top;
      
      const newClientX = newLeft + relX * ratio;
      const newClientY = newTop + relY * ratio;
      
      const diffX = newClientX - clientX;
      const diffY = newClientY - clientY;
      
      wrapper.style.transform = 'scale(' + pageScale + ')';
      document.getElementById('scale-display').innerText = Math.round(pageScale * 100) + '%';
      
      updateScrollSpacer();
      window.scrollTo(0, 0);
    } else {
      wrapper.style.transform = 'scale(' + pageScale + ')';
      document.getElementById('scale-display').innerText = Math.round(pageScale * 100) + '%';
      updateScrollSpacer();
    }
  }

  function fitToScreen() {
    const page = document.querySelector('.page');
    const panel = document.getElementById('control-panel');
    if (page && panel) {
      const panelHeight = panel.offsetHeight;
      document.body.style.paddingTop = panelHeight + 'px'; 
      
      const availWidth = window.innerWidth;
      const availHeight = window.innerHeight - panelHeight; 
      
      // 上下左右に24pxずつの余白(計48px)を確保
      const fitScale = Math.min((availWidth - 48) / page.offsetWidth, (availHeight - 48) / page.offsetHeight); 
      pageScale = Math.max(0.1, Math.min(2.0, fitScale));
      
      document.getElementById('scale-display').innerText = Math.round(pageScale * 100) + '%';
      document.getElementById('page-wrapper').style.transform = 'scale(' + pageScale + ')';
      
      updateScrollSpacer();
      window.scrollTo(0, 0);
    }
  }

  function initLayout() {
    const panel = document.getElementById('control-panel');
    if (panel) document.body.style.paddingTop = panel.offsetHeight + 'px';
    fitToScreen();
  }

  function saveAsHTML() { 
    document.querySelectorAll('select, input').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            if (el.checked) el.setAttribute('checked', 'checked');
            else el.removeAttribute('checked');
        } else {
            el.setAttribute('value', el.value);
            if (el.tagName.toLowerCase() === 'select') {
               Array.from(el.options).forEach(opt => {
                   if (opt.value === el.value) opt.setAttribute('selected', 'selected');
                   else opt.removeAttribute('selected');
               });
            }
        }
    });

    const filenameInput = document.getElementById('setting-filename');
    let filename = filenameInput ? filenameInput.value : '展開図レイアウト.html';
    if (!filename.endsWith('.html')) filename += '.html';

    const htmlContent = "<!DOCTYPE html>\\n<html lang=\\"ja\\">\\n" + document.documentElement.innerHTML + "\\n</html>"; 
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' }); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = filename; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
  }
  
  let activeDrag = null, activeResize = null, startX, startY, initX, initY, initW, initH;
  let currentZIndex = 20;
  let activeSvgDrag = null, svgStartX, svgStartY, initialTx = 0, initialTy = 0;

  document.addEventListener('pointerdown', (e) => {
    const svgDraggable = e.target.closest('.svg-draggable');
    if (svgDraggable) {
        e.stopPropagation(); 
        activeSvgDrag = svgDraggable;
        svgStartX = e.clientX;
        svgStartY = e.clientY;
        const transform = svgDraggable.getAttribute('transform');
        const match = transform ? transform.match(/translate\\(([^,]+),\\s*([^)]+)\\)/) : null;
        if (match) {
          initialTx = parseFloat(match[1]);
          initialTy = parseFloat(match[2]);
        } else {
          initialTx = 0; initialTy = 0;
        }
        if(svgDraggable.parentNode) {
          svgDraggable.parentNode.appendChild(svgDraggable);
        }
        return;
    }

    const draggable = e.target.closest('.draggable');
    if (draggable) {
        if (e.target.classList.contains('resize-handle')) activeResize = draggable; 
        else activeDrag = draggable; 
        
        startX = e.pageX; startY = e.pageY; 
        initX = draggable.offsetLeft; initY = draggable.offsetTop; 
        initW = draggable.offsetWidth; initH = draggable.offsetHeight; 
        
        if (!draggable.classList.contains('drawing')) {
          currentZIndex++;
          draggable.style.zIndex = currentZIndex; 
        }
        draggable.style.right = 'auto'; draggable.style.bottom = 'auto'; 
        draggable.style.left = initX + 'px'; draggable.style.top = initY + 'px';
    }
  });

  document.addEventListener('pointermove', (e) => { 
    if (activeDrag) { 
      activeDrag.style.left = (initX + (e.pageX - startX) / pageScale) + 'px'; 
      activeDrag.style.top = (initY + (e.pageY - startY) / pageScale) + 'px'; 
    } 
    else if (activeResize) { 
      activeResize.style.width = Math.max(50, initW + (e.pageX - startX) / pageScale) + 'px'; 
      activeResize.style.height = Math.max(50, initH + (e.pageY - startY) / pageScale) + 'px'; 
    }
    else if (activeSvgDrag) {
      const svgEl = document.querySelector('svg');
      if (svgEl) {
          const pt1 = svgEl.createSVGPoint();
          const pt2 = svgEl.createSVGPoint();
          pt1.x = svgStartX; pt1.y = svgStartY;
          pt2.x = e.clientX; pt2.y = e.clientY;
          
          const ctm = svgEl.getScreenCTM().inverse();
          const svgPt1 = pt1.matrixTransform(ctm);
          const svgPt2 = pt2.matrixTransform(ctm);
          
          const dx = svgPt2.x - svgPt1.x;
          const dy = svgPt2.y - svgPt1.y;
          
          activeSvgDrag.setAttribute('transform', \`translate(\${initialTx + dx}, \${initialTy + dy})\`);
      }
    }
  }); 

  document.addEventListener('pointerup', () => { activeDrag = null; activeResize = null; activeSvgDrag = null; });
  document.addEventListener('pointercancel', () => { activeDrag = null; activeResize = null; activeSvgDrag = null; });
  
  function setupWheelForElement(container, baseW, baseFS) {
      if (!container) return;
      if (container._wheelSetup) return; // 二重登録防止
      container._wheelSetup = true;
      
      let currentW = parseFloat(container.style.width);
      let currentFS = parseFloat(container.style.fontSize);
      let cw = !isNaN(currentW) ? currentW : baseW; 
      let cfs = !isNaN(currentFS) ? currentFS : baseFS; 
      
      if (cw !== null) container.style.width = cw + 'px'; 
      if (cfs !== null) container.style.fontSize = cfs + 'px'; 
      
      container.addEventListener('wheel', (e) => { 
        if (e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        e.stopPropagation();
        const f = e.deltaY > 0 ? 0.9 : 1.1; 
        
        const rect = container.getBoundingClientRect();
        const ratioX = (e.clientX - rect.left) / rect.width;
        const ratioY = (e.clientY - rect.top) / rect.height;
        const oldW = container.offsetWidth;
        const oldH = container.offsetHeight;

        if (cw !== null) { cw = Math.max(50, cw * f); container.style.width = cw + 'px'; } 
        if (cfs !== null) { cfs = Math.max(4, cfs * f); container.style.fontSize = cfs + 'px'; } 

        const newW = container.offsetWidth;
        const newH = container.offsetHeight;
        let currentLeft = parseFloat(container.style.left);
        let currentTop = parseFloat(container.style.top);
        if (isNaN(currentLeft) || !container.style.left.endsWith('px')) { currentLeft = container.offsetLeft; container.style.right = 'auto'; }
        if (isNaN(currentTop) || !container.style.top.endsWith('px')) { currentTop = container.offsetTop; container.style.bottom = 'auto'; }

        container.style.left = (currentLeft - (newW - oldW) * ratioX) + 'px';
        container.style.top = (currentTop - (newH - oldH) * ratioY) + 'px';
      }, { passive: false }); 
  }

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) return;
    if (e.target.closest('#control-panel')) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    changePageScale(delta, e.clientX, e.clientY);
  }, { passive: false });

  // 構造とスタイルの初期化
  updatePageStyle();
  updateScale();
  renderTables();
  
  setupWheelForElement(document.querySelector('.attributes-container'), 300, ${baseFontSize}); 
  setupWheelForElement(document.getElementById('scale-label-container'), null, ${baseFontSize * 1.2}); 
  setupWheelForElement(document.querySelector('.title-container'), null, ${baseFontSize * 2.5});
  
  const drawingContainer = document.getElementById('drawing'); 
  if (drawingContainer) {
    const scaleOptions = ['auto', '50', '100', '200', '250', '500', '1000'];
    drawingContainer.addEventListener('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      e.stopPropagation(); // 背景のズームに伝播させない

      const scaleSelect = document.getElementById('setting-scale');
      const scaleValue = scaleSelect.value;
      
      if (scaleValue === 'auto') {
        // 「自動」の時は自由に拡大・縮小する
        const f = e.deltaY > 0 ? 0.9 : 1.1; 
        
        const rect = drawingContainer.getBoundingClientRect();
        const ratioX = (e.clientX - rect.left) / rect.width;
        const ratioY = (e.clientY - rect.top) / rect.height;
        const oldW = drawingContainer.offsetWidth;
        const oldH = drawingContainer.offsetHeight;

        let cw = parseFloat(drawingContainer.style.width) || drawingContainer.offsetWidth;
        let ch = parseFloat(drawingContainer.style.height) || drawingContainer.offsetHeight;

        cw = Math.max(100, cw * f); 
        ch = Math.max(100, ch * f); 

        drawingContainer.style.width = cw + 'px';
        drawingContainer.style.height = ch + 'px';

        const newW = drawingContainer.offsetWidth;
        const newH = drawingContainer.offsetHeight;
        let currentLeft = parseFloat(drawingContainer.style.left);
        let currentTop = parseFloat(drawingContainer.style.top);
        if (isNaN(currentLeft) || !drawingContainer.style.left.endsWith('px')) { currentLeft = drawingContainer.offsetLeft; drawingContainer.style.right = 'auto'; }
        if (isNaN(currentTop) || !container.style.top.endsWith('px')) { currentTop = container.offsetTop; drawingContainer.style.bottom = 'auto'; }

        drawingContainer.style.left = (currentLeft - (newW - oldW) * ratioX) + 'px';
        drawingContainer.style.top = (currentTop - (newH - oldH) * ratioY) + 'px';
        
      } else {
        // 「指定」の時は段階的に縮尺を切り替える
        const currentIndex = scaleOptions.indexOf(scaleValue);
        
        if (e.deltaY > 0) {
          // 下スクロール（縮小したい）
          if (currentIndex < scaleOptions.length - 1) {
            scaleSelect.value = scaleOptions[currentIndex + 1];
            updateScale();
          }
        } else {
          // 上スクロール（拡大したい）
          if (currentIndex > 1) {
            scaleSelect.value = scaleOptions[currentIndex - 1];
            updateScale();
          }
        }
      }
    }, { passive: false });
  }

  // 最後に初期レイアウト調整を実行
  setTimeout(initLayout, 50);

<\/script></body></html>`;

  try {
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); } else { console.warn("ポップアップがブロックされました。ブラウザの設定をご確認ください。"); }
  } catch (err) {
    console.error("Preview failed:", err);
    console.warn("プレビューの表示に失敗しました。");
  }
};

// ==========================================
// 6. Shared Handlers & Modals
// ==========================================