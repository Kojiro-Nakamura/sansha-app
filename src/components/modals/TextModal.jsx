import React, { useState, useRef, useMemo, useEffect } from 'react';

export const TextModal = ({ info, onClose, onConfirm }) => {
  const [value, setValue] = useState(info.initialText);
  const inputRef = useRef(null);
  useEffect(() => { if (info.isOpen) { setValue(info.initialText); setTimeout(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, 10); } }, [info.isOpen, info.initialText, info.textId]);
  if (!info.isOpen) return null;
  return (
    <div className="fixed z-50 bg-white p-2.5 rounded-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1.5" style={{ left: info.x, top: info.y, transform: 'translate(-50%, -100%)', marginTop: '-16px' }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-slate-200 rotate-45"></div>
      <h3 className="font-bold text-slate-700 text-[10px] px-1">テキストを入力</h3>
      <div className="flex items-center gap-1.5 px-1">
        <input ref={inputRef} type="text" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onConfirm(info.textId, value, info.logicalX, info.logicalY); if (e.key === 'Escape') onClose(); }} className="w-48 pl-2 py-1.5 border border-slate-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-colors" placeholder="文字を入力..." />
      </div>
      <div className="flex justify-between items-center mt-1 gap-1">
        <button onClick={onClose} className="px-2 py-1.5 text-slate-500 hover:bg-slate-100 rounded transition-colors text-[10px] font-medium shrink-0">閉じる</button>
        <button onClick={() => onConfirm(info.textId, value, info.logicalX, info.logicalY)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors text-[10px] font-medium shadow-sm whitespace-nowrap">確定 (Enter)</button>
      </div>
    </div>
  );
};
