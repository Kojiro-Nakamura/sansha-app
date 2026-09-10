// 2. Constants & Defaults
// ==========================================
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const defaultSlopeTypes = [
  { id: 't1', name: '未設定', shortName: '未', color: '#94a3b8' }, 
  { id: 't2', name: 'モルタル吹付', shortName: 'モ', color: '#0ea5e9' }, 
  { id: 't3', name: '植生基盤吹付', shortName: '植', color: '#f97316' }, 
  { id: 't4', name: '緑化材A', shortName: '緑A', color: '#22c55e' }, 
  { id: 't5', name: '緑化材B', shortName: '緑B', color: '#eab308' }, 
];

export const defaultAttributes = [
  { id: "aa5m69ol6", key: "年度", value: "令和8年度" },
  { id: "vhjyzhaz4", key: "事業名", value: "〇〇事業" },
  { id: "mcfogk9gt", key: "工事箇所", value: "××町～～" }
];

export const defaultNodes = [
  { id: "xvslsq8pk", x: 286.356124844675, y: 89.56166051595218 },
  { id: "388jd823t", x: 291.8364549011752, y: 286.20014948532554 },
  { id: "mxiviecm0", x: 202.60963420261047, y: 305.49623932833424 },
  { id: "ecyu9vdei", x: 369.2815714608369, y: 76.42495610151069 },
  { id: "afbjq43kf", x: 423.45478592656934, y: 279.9740539899585 },
  { id: "8mtzu9i7d", x: 456.3122382065118, y: 92.84583661956256 },
  { id: "ecw452mqd", x: 537.5955967708685, y: 128.97177375927666 },
  { id: "mrfb60b7s", x: 564.6900496256542, y: 298.10684309521093 },
  { id: "l6cr5lohv", x: 212.4621625134416, y: 126.50864168156889 },
  { id: "dllicnwa2", x: 287.1771688705776, y: 41.941107013601766 },
  { id: "bev0ml4i7", x: 364.45409855842183, y: 8.2994111192106 },
  { id: "bh93dd3o7", x: 459.25240477379504, y: 30.016917384689826 },
  { id: "qk0zocbq1", x: 340.26597002932186, y: 267.23539319870093 },
  { id: "j1igzez2u", x: 345.45582881211857, y: 230.10794190638597 },
  { id: "c5lyc2ivu", x: 393.76143748276496, y: 226.91418265543413 },
  { id: "z9hh5jqbs", x: 404.14115504835837, y: 264.8400737604871 }
];

export const defaultEdges = [
  { id: "ogsn6upt8", source: "xvslsq8pk", target: "388jd823t", length: 10 },
  { id: "iicpbe2ud", source: "388jd823t", target: "mxiviecm0", length: 5 },
  { id: "m3o1wq3hv", source: "mxiviecm0", target: "xvslsq8pk", length: 12 },
  { id: "59h0yojll", source: "xvslsq8pk", target: "ecyu9vdei", length: 4 },
  { id: "yk3z7wbr3", source: "ecyu9vdei", target: "388jd823t", length: 10 },
  { id: "t6eaaalm0", source: "388jd823t", target: "afbjq43kf", length: 6 },
  { id: "lvzkmsd9w", source: "afbjq43kf", target: "ecyu9vdei", length: 10 },
  { id: "6tn3xb662", source: "ecyu9vdei", target: "8mtzu9i7d", length: 5 },
  { id: "hdova895s", source: "8mtzu9i7d", target: "afbjq43kf", length: 9 },
  { id: "gxml92x2d", source: "afbjq43kf", target: "ecw452mqd", length: 8 },
  { id: "115c5a8pj", source: "ecw452mqd", target: "8mtzu9i7d", length: 4 },
  { id: "6ul66iclm", source: "ecw452mqd", target: "mrfb60b7s", length: 7 },
  { id: "428rooks4", source: "mrfb60b7s", target: "afbjq43kf", length: 6 },
  { id: "tln5j07fj", source: "mxiviecm0", target: "l6cr5lohv", length: 9 },
  { id: "sqr72lwla", source: "l6cr5lohv", target: "xvslsq8pk", length: 4 },
  { id: "2k5xf21nr", source: "l6cr5lohv", target: "dllicnwa2", length: 6 },
  { id: "lggzd347l", source: "dllicnwa2", target: "xvslsq8pk", length: 3 },
  { id: "1xh1npys1", source: "dllicnwa2", target: "ecyu9vdei", length: 4 },
  { id: "ck3injgkc", source: "dllicnwa2", target: "bev0ml4i7", length: 4 },
  { id: "2end9is6p", source: "bev0ml4i7", target: "ecyu9vdei", length: 3 },
  { id: "tj0aqt3v5", source: "bev0ml4i7", target: "bh93dd3o7", length: 5 },
  { id: "ifx9oab56", source: "bh93dd3o7", target: "ecyu9vdei", length: 5 },
  { id: "54yo2sp1v", source: "bh93dd3o7", target: "8mtzu9i7d", length: 3 },
  { id: "71b6k3l39", source: "bh93dd3o7", target: "ecw452mqd", length: 6 },
  { id: "nbqahirej", source: "qk0zocbq1", target: "j1igzez2u", length: 2 },
  { id: "93q0cqkcm", source: "j1igzez2u", target: "c5lyc2ivu", length: 2 },
  { id: "5qdtj1qz6", source: "c5lyc2ivu", target: "qk0zocbq1", length: 2.5 },
  { id: "ixyqb1nk8", source: "c5lyc2ivu", target: "z9hh5jqbs", length: 2 },
  { id: "9ja28jtip", source: "z9hh5jqbs", target: "qk0zocbq1", length: 2 }
];

export const defaultLines = [
  {
    id: "lxvcn0464",
    points: [ { x: 186.2308565668053, y: 329.3730879345007 }, { x: 296.9544169422594, y: 304.44502262084075 }, { x: 422.94220650048675, y: 297.7077076712029 }, { x: 563.7520889479173, y: 316.57218953018884 }, { x: 590.1043516495623, y: 320.29163282469966 } ],
    color: "#64748b",
    strokeWidth: 2,
    strokeDasharray: "none",
    isCurve: true
  },
  {
    id: "hvkc2t59c",
    points: [ { x: 187.89833663326746, y: 375.9665808458053 }, { x: 299.67643368640006, y: 348.4156414313008 }, { x: 425.89417487909884, y: 339.7567747581708 }, { x: 591.9869810636832, y: 361.79752628977445 } ],
    color: "#64748b",
    strokeWidth: 2,
    strokeDasharray: "none",
    isCurve: true
  }
];

export const defaultTexts = [
  { id: "ddv58kpi8", x: 213.7441031216585, y: 347.40439220551326, text: "← 至 〇〇市", color: "#334155", fontSize: 8, rotation: -17.136005351957543 },
  { id: "ltrqzek1d", x: 559.2602789089641, y: 339.4531831392782, text: "至 △△町 →", color: "#334155", fontSize: 8, rotation: 11.33224463755758 },
  { id: "i014p5vwc", x: 383.2522885664701, y: 319.170701457297, text: "林道◇◇線", color: "#334155", fontSize: 8, rotation: 0 }
];

export const defaultFaceTypes = {
  "face-388jd823t-afbjq43kf-ecyu9vdei": "t2",
  "face-388jd823t-mxiviecm0-xvslsq8pk": "t2",
  "face-388jd823t-ecyu9vdei-xvslsq8pk": "t2",
  "face-l6cr5lohv-mxiviecm0-xvslsq8pk": "t2",
  "face-8mtzu9i7d-afbjq43kf-ecyu9vdei": "t2",
  "face-8mtzu9i7d-afbjq43kf-ecw452mqd": "t2",
  "face-afbjq43kf-ecw452mqd-mrfb60b7s": "t2",
  "face-dllicnwa2-l6cr5lohv-xvslsq8pk": "t3",
  "face-dllicnwa2-ecyu9vdei-xvslsq8pk": "t3",
  "face-bev0ml4i7-dllicnwa2-ecyu9vdei": "t3",
  "face-bev0ml4i7-bh93dd3o7-ecyu9vdei": "t3",
  "face-8mtzu9i7d-bh93dd3o7-ecyu9vdei": "t3",
  "face-8mtzu9i7d-bh93dd3o7-ecw452mqd": "t3",
  "face-c5lyc2ivu-j1igzez2u-qk0zocbq1": "t2",
  "face-c5lyc2ivu-qk0zocbq1-z9hh5jqbs": "t2"
};

export const defaultFaceDeductions = {
  "face-c5lyc2ivu-j1igzez2u-qk0zocbq1": true,
  "face-c5lyc2ivu-qk0zocbq1-z9hh5jqbs": true
};

export const defaultFractionDigits = 2;

export const initialDragState = {
  isDragging: false, type: null, sourceNodeId: null,
  startX: 0, startY: 0, currentX: 0, currentY: 0,
  initCamera: null, isNewNode: false, logicalStartX: 0, logicalStartY: 0,
  trackingNodeIds: [], triangleNode1: null, triangleNode2: null, isNode2New: false,
  edge1Id: null, targetType: null, targetId: null, initialLine: null, initialText: null,
  activeLinePoints: [], isCurveMode: false,
  initialNodes: [], initialLines: [], initialTexts: [],
  elementsToMove: { nodeIds: new Set(), lineIds: new Set(), textIds: new Set() },
  centerX: 0, centerY: 0
};

// ==========================================