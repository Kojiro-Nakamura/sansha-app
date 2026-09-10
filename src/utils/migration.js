import { defaultSlopeTypes, defaultAttributes } from '../constants/defaults.js';

// 4. Data Migration Utility
// ==========================================
export const migrateData = (parsed) => {
  if (!parsed || !parsed.nodes || !parsed.edges) return null;

  const importedLines = (parsed.lines || []).map(l => ({
    ...l,
    points: l.points || [{ x: l.x1 || 0, y: l.y1 || 0 }, { x: l.x2 || 0, y: l.y2 || 0 }],
    isCurve: !!l.isCurve,
    strokeWidth: l.strokeWidth ?? 2,
    color: l.color ?? '#64748b',
    strokeDasharray: l.strokeDasharray ?? 'none'
  }));

  const importedTexts = (parsed.texts || []).map(t => ({
    ...t,
    rotation: t.rotation ?? 0,
    fontSize: t.fontSize === 16 ? 8 : (t.fontSize ?? 8),
    color: t.color ?? '#334155'
  }));

  const importedFaceDeductions = parsed.faceDeductions || {};

  const oldDeductionTypeIds = new Set((parsed.slopeTypes || []).filter(t => t.isDeduction).map(t => t.id));
  if (parsed.faceTypes && oldDeductionTypeIds.size > 0) {
    Object.entries(parsed.faceTypes).forEach(([faceId, typeId]) => {
      if (oldDeductionTypeIds.has(typeId)) {
        importedFaceDeductions[faceId] = true;
      }
    });
  }

  const importedSlopeTypes = (parsed.slopeTypes || defaultSlopeTypes)
    .filter(st => !st.isDeduction)
    .map(st => ({
      ...st,
      shortName: st.shortName || (st.name ? st.name.charAt(0) : '未'),
      color: st.color ?? '#94a3b8'
    }));

  return {
    nodes: parsed.nodes,
    edges: parsed.edges.map(e => ({ ...e, length: e.length === undefined ? null : e.length })),
    lines: importedLines,
    texts: importedTexts,
    faceTypes: parsed.faceTypes || {},
    faceDeductions: importedFaceDeductions,
    slopeTypes: importedSlopeTypes.length > 0 ? importedSlopeTypes : defaultSlopeTypes,
    fractionDigits: parsed.fractionDigits ?? 2,
    attributes: parsed.attributes || defaultAttributes
  };
};

export const getInitialData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('sansha_draw_data');
    if (saved) return migrateData(JSON.parse(saved));
  } catch (e) { console.error("Failed to parse saved data", e); }
  return null;
};

// ==========================================