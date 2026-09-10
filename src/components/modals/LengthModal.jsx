import React, { useState, useRef, useMemo, useEffect } from 'react';

export const LengthModal = ({ info, defaultApply, onClose, onConfirm }) => {
  const [value, setValue] = useState(info.initialValue);
  const inputRef = useRef(null);
  useEffect(() => { if (info.isOpen) { setValue(info.initialValue); setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, 10); } }, [info.isOpen, info.initialValue, info.edgeId]);
  if (!info.isOpen) return null;
  return (
    <div className="fixed z-50 bg-white p-2.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1.5" style={{ left: info.x, top: info.y, transform: 'translate(-50%, -100%)', marginTop: '-16px' }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-slate-200 rotate-45"></div>
      <div className="flex justify-between items-center px-1"><h3 className="font-bold text-slate-700 text-[10px]">辺の長さを入力</h3></div>
      <div className="flex items-center gap-1.5 px-1">
        <input ref={inputRef} type="number" step="0.1" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { const apply = e.shiftKey ? !defaultApply : defaultApply; onConfirm(info.edgeId, value, apply); } if (e.key === 'Escape') onClose(); }} className="w-full pl-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-colors" placeholder="0.00" />
        <span className="text-slate-500 font-medium text-xs">m</span>
      </div>
      <div className="flex justify-between items-center mt-1 gap-1">
        <button onClick={onClose} className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors text-[10px] font-medium shrink-0">閉じる</button>
        <div className="flex gap-1.5">
          <button onClick={() => onConfirm(info.edgeId, value, false)} className={`px-2.5 py-1.5 rounded transition-colors text-[10px] font-medium shadow-sm whitespace-nowrap ${!defaultApply ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`} title={`数値だけを更新 (${!defaultApply ? 'Enter' : 'Shift+Enter'})`}>数値のみ確定</button>
          <button onClick={() => onConfirm(info.edgeId, value, true)} className={`px-2.5 py-1.5 rounded transition-colors text-[10px] font-medium shadow-sm whitespace-nowrap ${defaultApply ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'}`} title={`図形の長さを伸縮させる (${defaultApply ? 'Enter' : 'Shift+Enter'})`}>図形に反映して確定</button>
        </div>
      </div>
    </div>
  );
};
