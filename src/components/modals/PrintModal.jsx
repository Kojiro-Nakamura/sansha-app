import React, { useState, useRef, useMemo, useEffect } from 'react';

export const PrintModal = ({ isOpen, onClose, onPrint }) => {
  const [size, setSize] = useState('A4'); 
  const [orientation, setOrientation] = useState('landscape'); 
  const [colorMode, setColorMode] = useState('color'); 
  const [tableRowsLimit, setTableRowsLimit] = useState(50); 
  const [scale, setScale] = useState('auto'); 
  const [showAreaInPolygon, setShowAreaInPolygon] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1.0);
  const [edgeTextOffset, setEdgeTextOffset] = useState(6); 

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onPointerDown={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200" onPointerDown={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><IconPrinter size={20} className="text-blue-500" />印刷・HTML出力</h3>
        <div className="space-y-3 mb-6">
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">用紙サイズ</label><select value={size} onChange={e => setSize(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"><option value="A4">A4サイズ</option><option value="A3">A3サイズ</option><option value="A1">A1サイズ (大判)</option></select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">向き</label><select value={orientation} onChange={e => setOrientation(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"><option value="landscape">横向き (図と表を左右に配置)</option><option value="portrait">縦向き (図と表を上下に配置)</option></select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">縮尺 (図面の大きさ)</label><select value={scale} onChange={e => setScale(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"><option value="auto">自動 (枠に合わせて最大化)</option><option value="50">1/50</option><option value="100">1/100</option><option value="200">1/200</option><option value="250">1/250</option><option value="500">1/500</option><option value="1000">1/1000</option></select>{scale !== 'auto' && <p className="text-[10px] text-slate-400 mt-1">※全体の平均値から正確な縮尺を逆算して描画します。</p>}</div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">図形内の面積表示</label><label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={showAreaInPolygon} onChange={e => setShowAreaInPolygon(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" /><span className="text-slate-700">図形の中に面積を表示</span></label></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">文字の大きさ (倍率)</label><input type="number" min="0.5" max="5.0" step="0.1" value={fontSizeMultiplier} onChange={e => setFontSizeMultiplier(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">辺の寸法文字の距離</label><input type="number" min="0" max="100" step="1" value={edgeTextOffset} onChange={e => setEdgeTextOffset(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">カラー設定</label><select value={colorMode} onChange={e => setColorMode(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"><option value="color">カラー (画面の見た目まま)</option><option value="bw">白黒線画 (図面提出用)</option></select></div>
          <div><label className="block text-xs font-semibold text-slate-500 mb-1">表の折り返し（分割）行数</label><input type="number" min="1" max="1000" value={tableRowsLimit} onChange={e => setTableRowsLimit(Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div>
        </div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">キャンセル</button><button onClick={() => onPrint({ size, orientation, colorMode, tableRowsLimit, scale, showAreaInPolygon, fontSizeMultiplier, edgeTextOffset })} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">プレビューを開く</button></div>
      </div>
    </div>
  );
};
