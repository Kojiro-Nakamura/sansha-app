import React, { useState, useRef, useMemo, useEffect } from 'react';

export const PropertyPanel = ({ selectedIds, faces, edges, nodes, lines, texts, faceTypes, faceDeductions, slopeTypes, totalArea, attributes, setFaceTypes, setFaceDeductions, setShouldSaveHistory, updateEdgeLength, applyLengthToNode, setSlopeTypes, fractionDigits, setFractionDigits, setLines, setTexts, setAttributes }) => {
  const selectedIdArray = Array.from(selectedIds);
  const isSingleSelection = selectedIdArray.length === 1;
  const selectedId = isSingleSelection ? selectedIdArray[0] : null;

  let selectedType = null;
  if (isSingleSelection) {
    if (faces.find(f => f.id === selectedId)) selectedType = 'face';
    else if (edges.find(e => e.id === selectedId)) selectedType = 'edge';
    else if (nodes.find(n => n.id === selectedId)) selectedType = 'node';
    else if (lines.find(l => l.id === selectedId)) selectedType = 'line';
    else if (texts.find(t => t.id === selectedId)) selectedType = 'text';
  } else if (selectedIdArray.length > 1) { selectedType = 'multiple'; }

  const selectedFace = selectedType === 'face' ? faces.find(f => f.id === selectedId) : null;
  const selectedEdge = selectedType === 'edge' ? edges.find(e => e.id === selectedId) : null;
  const selectedLine = selectedType === 'line' ? lines.find(l => l.id === selectedId) : null;
  const selectedText = selectedType === 'text' ? texts.find(t => t.id === selectedId) : null;

  const [localEdgeLength, setLocalEdgeLength] = useState('');
  useEffect(() => { if (selectedEdge) setLocalEdgeLength(selectedEdge.length === null ? '' : String(selectedEdge.length)); else setLocalEdgeLength(''); }, [selectedId, selectedEdge?.length]);

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col z-10 shadow-sm overflow-y-auto shrink-0">
      <div className="p-3 border-b border-slate-200 bg-slate-50 sticky top-0 z-10"><h1 className="font-bold text-slate-800 text-base tracking-tight">三斜求積 作図エディタ</h1><p className="text-[10px] text-slate-500">工種と面積を管理</p></div>
      <div className="p-3 flex-1">
        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">プロパティ</h2>
        
        {selectedType === 'multiple' ? (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 space-y-1"><div className="flex items-center gap-2 text-blue-700 text-sm font-medium mb-1"><IconMousePointer2 size={14}/> 複数選択中</div><p className="text-[10px] text-slate-600 leading-tight"><b>{selectedIds.size}</b> 個の要素を選択しています。ドラッグでまとめて移動・回転が可能です。<br/>(Deleteキーで一括削除できます)</p></div>
        ) : selectedType === 'face' && selectedFace ? (
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium mb-1"><div className="w-3.5 h-3.5 bg-emerald-500 rounded-sm opacity-60"></div>面 {selectedFace.number ? `(${slopeTypes.find(t => t.id === (faceTypes[selectedFace.id] || 't1'))?.name} ${selectedFace.number})` : ''}</div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">工種</label>
              <select value={faceTypes[selectedFace.id] || 't1'} onChange={e => { setFaceTypes(prev => ({ ...prev, [selectedFace.id]: e.target.value })); setShouldSaveHistory(true); }} className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-transparent transition-all text-xs">{slopeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
            </div>
            <label className="flex items-center gap-2 mt-2 cursor-pointer bg-white px-2 py-1.5 border border-slate-200 rounded hover:bg-slate-50 transition-colors">
              <input type="checkbox" checked={!!faceDeductions[selectedFace.id]} onChange={e => { setFaceDeductions(prev => ({ ...prev, [selectedFace.id]: e.target.checked })); setShouldSaveHistory(true); }} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" />
              <span className="text-xs text-slate-700 font-medium select-none">この面を控除（マイナス）として扱う</span>
            </label>
            <div className="flex justify-between items-center text-xs border-t border-emerald-200 pt-1.5 mt-1.5">
              <span className="text-emerald-700">面積</span>
              <span className={`font-bold text-sm ${faceDeductions[selectedFace.id] ? 'text-red-600' : 'text-emerald-900'}`}>{selectedFace.area !== null ? (faceDeductions[selectedFace.id] ? '-' : '') + selectedFace.area.toFixed(fractionDigits) : '-'} ㎡</span>
            </div>
          </div>
        ) : selectedType === 'edge' && selectedEdge ? (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 space-y-2"><div className="flex items-center gap-2 text-blue-800 text-sm font-medium mb-1"><div className="w-5 h-px bg-blue-800"></div>辺 (Edge)</div><div><label className="block text-[10px] text-slate-500 mb-0.5">測量長さ (m)</label><div className="flex gap-1.5"><input type="number" step="0.1" value={localEdgeLength} onChange={(e) => setLocalEdgeLength(e.target.value)} onBlur={() => { updateEdgeLength(selectedEdge.id, localEdgeLength); setShouldSaveHistory(true); }} onKeyDown={(e) => { if (e.key === 'Enter') { updateEdgeLength(selectedEdge.id, localEdgeLength); if (e.shiftKey) applyLengthToNode(selectedEdge.id, localEdgeLength); setShouldSaveHistory(true); } }} className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all text-sm" placeholder="寸法を入力..." /><button onClick={() => { updateEdgeLength(selectedEdge.id, localEdgeLength); applyLengthToNode(selectedEdge.id, localEdgeLength); setShouldSaveHistory(true); }} className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium rounded transition-colors whitespace-nowrap">見た目に反映</button></div></div><p className="text-[10px] text-slate-500 mt-1 leading-tight">数値を変更すると面積が自動再計算されます。「見た目に反映」で図面上の線の長さを調整できます。</p></div>
        ) : selectedType === 'node' ? (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1"><div className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-1"><div className="w-3 h-3 rounded-full border-2 border-slate-700"></div>頂点 (Node)</div><p className="text-[10px] text-slate-500 leading-tight">キャンバス上でドラッグして、図面として整うように位置を調整してください。</p></div>
        ) : selectedType === 'line' && selectedLine ? (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2"><div className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-1"><IconMinus size={14}/> 補助線</div><div><label className="block text-[10px] text-slate-500 mb-0.5">形状</label><select value={selectedLine.isCurve ? 'curve' : 'straight'} onChange={e => { setLines(prev => prev.map(l => l.id === selectedId ? { ...l, isCurve: e.target.value === 'curve' } : l)); setShouldSaveHistory(true); }} className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"><option value="straight">折れ線 (直線)</option><option value="curve">滑らか (曲線)</option></select></div><div className="flex gap-2"><div className="flex-1"><label className="block text-[10px] text-slate-500 mb-0.5">線の色</label><input type="color" value={selectedLine.color} onChange={e => { setLines(prev => prev.map(l => l.id === selectedId ? { ...l, color: e.target.value } : l)); setShouldSaveHistory(true); }} className="w-full h-7 rounded cursor-pointer border border-slate-300 p-0" /></div><div className="flex-1"><label className="block text-[10px] text-slate-500 mb-0.5">線の太さ</label><input type="number" min="1" max="10" value={selectedLine.strokeWidth} onChange={e => { setLines(prev => prev.map(l => l.id === selectedId ? { ...l, strokeWidth: Number(e.target.value) } : l)); setShouldSaveHistory(true); }} className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></div></div><div><label className="block text-[10px] text-slate-500 mb-0.5">種類</label><select value={selectedLine.strokeDasharray || 'none'} onChange={e => { setLines(prev => prev.map(l => l.id === selectedId ? { ...l, strokeDasharray: e.target.value } : l)); setShouldSaveHistory(true); }} className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"><option value="none">実線</option><option value="4 4">点線</option><option value="8 8">破線</option><option value="12 4 4 4">一点鎖線</option></select></div></div>
        ) : selectedType === 'text' && selectedText ? (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2"><div className="flex items-center gap-2 text-slate-700 text-sm font-medium mb-1"><IconType size={14}/> テキスト</div><div><label className="block text-[10px] text-slate-500 mb-0.5">テキスト内容</label><input type="text" value={selectedText.text} onChange={e => { setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, text: e.target.value } : t)); }} onBlur={() => setShouldSaveHistory(true)} onKeyDown={e => { if(e.key === 'Enter') setShouldSaveHistory(true); }} className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></div><div className="flex gap-2"><div className="flex-1"><label className="block text-[10px] text-slate-500 mb-0.5">文字色</label><input type="color" value={selectedText.color} onChange={e => { setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, color: e.target.value } : t)); setShouldSaveHistory(true); }} className="w-full h-7 rounded cursor-pointer border border-slate-300 p-0" /></div><div className="flex-1"><label className="block text-[10px] text-slate-500 mb-0.5">フォントサイズ</label><input type="number" min="4" max="72" value={selectedText.fontSize} onChange={e => { setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, fontSize: Number(e.target.value) } : t)); setShouldSaveHistory(true); }} className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></div></div><div><label className="block text-[10px] text-slate-500 mb-0.5">角度 (°)</label><div className="flex items-center gap-2"><input type="range" min="-180" max="180" value={selectedText.rotation || 0} onChange={e => { setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, rotation: Number(e.target.value) } : t)); }} onMouseUp={() => setShouldSaveHistory(true)} onTouchEnd={() => setShouldSaveHistory(true)} className="flex-1 h-3" /><input type="number" value={selectedText.rotation || 0} onChange={e => { setTexts(prev => prev.map(t => t.id === selectedId ? { ...t, rotation: Number(e.target.value) } : t)); setShouldSaveHistory(true); }} className="w-14 px-1 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs text-center" /></div></div></div>
        ) : (<div className="text-xs text-slate-500 text-center py-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">要素をクリックして選択</div>)}

        <div className="mt-5">
          <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">計算結果</h2>
          <div className="bg-slate-800 p-3 rounded-xl shadow-inner text-white"><div className="text-[10px] text-slate-300 mb-0.5">総面積 (控除面はマイナス)</div><div className="text-2xl font-bold tracking-tight">{totalArea.toFixed(fractionDigits)} <span className="text-sm text-slate-400 font-medium">㎡</span></div></div>
          
          <div className="mt-3 space-y-1"><div className="text-[10px] font-semibold text-slate-500 mb-1 border-b border-slate-200 pb-1">種類別 面積内訳</div>
            {slopeTypes.map(type => {
              const typeFaces = faces.filter(f => f.status === 'valid' && (faceTypes[f.id] || 't1') === type.id);
              if (typeFaces.length === 0) return null;

              const parentFaces = typeFaces.filter(f => !faceDeductions[f.id]);
              const deductFaces = typeFaces.filter(f => faceDeductions[f.id]);

              const parentArea = parentFaces.reduce((sum, f) => sum + f.area, 0);
              const deductArea = deductFaces.reduce((sum, f) => sum + f.area, 0);
              
              if (parentArea === 0 && deductArea === 0) return null;

              return (
                <div key={type.id} className="border-b border-slate-100 last:border-0 py-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: type.color }}></div>
                      <span className="text-slate-700 font-medium truncate max-w-[120px]" title={type.name}>{type.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 whitespace-nowrap">{parentArea.toFixed(fractionDigits)} ㎡</span>
                  </div>
                  {deductFaces.length > 0 && (
                    <div className="flex justify-between items-center text-[10px] mt-0.5 pl-4 pr-1">
                      <span className="text-slate-500">└ 控除分</span>
                      <span className="text-red-600 font-medium">-{deductArea.toFixed(fractionDigits)} ㎡</span>
                    </div>
                  )}
                  {deductFaces.length > 0 && (
                    <div className="flex justify-between items-center text-xs mt-0.5 pl-4 pr-1">
                      <span className="text-slate-600 font-medium">差引面積</span>
                      <span className="font-bold text-slate-800 border-t border-slate-200 pt-0.5">{(parentArea - deductArea).toFixed(fractionDigits)} ㎡</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {faces.some(f => f.status === 'invalid_triangle') && (<div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg flex gap-1.5 items-start text-red-700 text-[10px] leading-tight"><IconAlertCircle size={14} className="shrink-0 mt-px" /><p>寸法から三角形が成立しない面があります。赤い面を確認してください。</p></div>)}
        </div>

        <div className="mt-4 border-t border-slate-200 pt-3 pb-1"><div className="flex justify-between items-center mb-2"><h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">表示設定</h2></div><div className="flex items-center justify-between"><span className="text-xs text-slate-600">小数点以下の表示桁数</span><select value={fractionDigits} onChange={e => { setFractionDigits(Number(e.target.value)); setShouldSaveHistory(true); }} className="px-2 py-1 border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-medium"><option value={0}>0桁 (整数)</option><option value={1}>1桁 (0.0)</option><option value={2}>2桁 (0.00)</option><option value={3}>3桁 (0.000)</option></select></div></div>

        <div className="mt-3 border-t border-slate-200 pt-3 pb-2">
          <div className="flex justify-between items-center mb-2"><h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">図面属性 (印刷用)</h2><button onClick={() => { setAttributes(prev => [...prev, { id: generateId(), key: '新規項目', value: '' }]); setShouldSaveHistory(true); }} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded transition-colors">+ 追加</button></div>
          <div className="space-y-1.5">
            {attributes.map((attr) => (
              <div key={attr.id} className="flex items-center gap-1.5">
                <input type="text" value={attr.key} onChange={e => setAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, key: e.target.value } : a))} onBlur={() => setShouldSaveHistory(true)} onKeyDown={e => { if(e.key === 'Enter') setShouldSaveHistory(true); }} className="w-20 px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600 bg-slate-50" placeholder="項目名" />
                <input type="text" value={attr.value} onChange={e => setAttributes(prev => prev.map(a => a.id === attr.id ? { ...a, value: e.target.value } : a))} onBlur={() => setShouldSaveHistory(true)} onKeyDown={e => { if(e.key === 'Enter') setShouldSaveHistory(true); }} className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0" placeholder="値" />
                <button onClick={() => { setAttributes(prev => prev.filter(a => a.id !== attr.id)); setShouldSaveHistory(true); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0" title="削除"><IconEraser size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 border-t border-slate-200 pt-3 pb-2">
          <div className="flex justify-between items-center mb-2"><h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">工種設定</h2><button onClick={() => { setSlopeTypes(prev => [...prev, { id: generateId(), name: '新規種類', shortName: '新', color: '#3b82f6' }]); setShouldSaveHistory(true); }} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 rounded transition-colors">+ 追加</button></div>
          <div className="space-y-1.5">
            {slopeTypes.map((type, idx) => (
              <div key={type.id} className="flex items-center gap-1.5">
                <input type="color" value={type.color} onChange={e => setSlopeTypes(prev => prev.map(t => t.id === type.id ? { ...t, color: e.target.value } : t))} onBlur={() => setShouldSaveHistory(true)} className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 shrink-0" title="色を変更" />
                <input type="text" value={type.name} onChange={e => setSlopeTypes(prev => prev.map(t => t.id === type.id ? { ...t, name: e.target.value } : t))} onBlur={() => setShouldSaveHistory(true)} onKeyDown={e => { if(e.key === 'Enter') setShouldSaveHistory(true); }} className="flex-1 px-1.5 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0" placeholder="名称" />
                <input type="text" value={type.shortName || ''} onChange={e => setSlopeTypes(prev => prev.map(t => t.id === type.id ? { ...t, shortName: e.target.value } : t))} onBlur={() => setShouldSaveHistory(true)} onKeyDown={e => { if(e.key === 'Enter') setShouldSaveHistory(true); }} className="w-8 px-1 py-1 border border-slate-300 rounded text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 text-center shrink-0" title="図面上の略称" placeholder="略" />
                
                {idx > 0 ? (<button onClick={() => { setSlopeTypes(prev => prev.filter(t => t.id !== type.id)); setFaceTypes(prev => { const next = { ...prev }; for (const k in next) if (next[k] === type.id) next[k] = 't1'; return next; }); setShouldSaveHistory(true); }} className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0" title="この種類を削除"><IconEraser size={14} /></button>) : <div className="w-6"></div>}
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 leading-tight">※ 種類の色や名前を変更できます。一番上の「未設定」は削除できません。</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 8. SVG Render Components (Layers)
// ==========================================