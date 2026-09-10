import React, { useState, useRef, useMemo, useEffect } from 'react';

export const FaceModal = ({ info, slopeTypes, faceTypes, faceDeductions, onClose, onSelect, onAdd, onToggleDeduction }) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  useEffect(() => { if (info.isOpen) { setIsAddingNew(false); setNewTypeName(''); } }, [info.isOpen, info.faceId]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (info.isOpen && e.key === 'Enter' && !isAddingNew) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [info.isOpen, isAddingNew, onClose]);

  if (!info.isOpen) return null;
  return (
    <div className="face-modal-content fixed z-50 bg-white p-2 rounded-lg shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-1.5" style={{ left: info.x, top: info.y, transform: 'translate(-50%, -100%)', marginTop: '-12px' }} onPointerDown={(e) => e.stopPropagation()}>
      <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45"></div>
      <h3 className="font-bold text-slate-700 text-[10px] text-center w-full">工種</h3>
      {!isAddingNew ? (
        <>
          <div className="flex flex-col gap-1 mt-0.5 w-36 max-h-40 overflow-y-auto pr-1">
            {slopeTypes.map(type => { const isSelected = (faceTypes[info.faceId] || 't1') === type.id; return (<button key={type.id} onClick={() => onSelect(info.faceId, type.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors font-medium border ${isSelected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}><div className="w-3 h-3 rounded-full border border-slate-300 shadow-sm shrink-0" style={{ backgroundColor: type.color }}></div><span className="truncate">{type.name}</span></button>); })}
          </div>
          <div className="border-t border-slate-200 mt-1 pt-1.5">
            <label className="flex items-center gap-2 cursor-pointer px-1 py-0.5 hover:bg-slate-50 rounded transition-colors">
              <input type="checkbox" checked={!!faceDeductions[info.faceId]} onChange={e => onToggleDeduction(info.faceId, e.target.checked)} className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" />
              <span className="text-[10px] text-slate-600 font-medium select-none">控除（マイナス）として扱う</span>
            </label>
          </div>
          <div className="flex justify-between items-center gap-1 mt-0.5">
            <button onClick={onClose} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded transition-colors text-[10px] font-medium">閉じる</button>
            <button onClick={() => setIsAddingNew(true)} className="flex-1 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors text-right pr-1">+ 新規追加</button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-1.5 mt-0.5 w-36">
          <input autoFocus type="text" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { if(newTypeName.trim() !== '') { onAdd(info.faceId, newTypeName.trim()); setIsAddingNew(false); } } if (e.key === 'Escape') setIsAddingNew(false); }} placeholder="種類名を入力" className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:border-blue-500" />
          <div className="flex justify-end gap-1 mt-0.5">
            <button onClick={() => setIsAddingNew(false)} className="px-2 py-1 text-slate-500 hover:bg-slate-100 rounded transition-colors text-[10px] font-medium">戻る</button>
            <button disabled={newTypeName.trim() === ''} onClick={() => { onAdd(info.faceId, newTypeName.trim()); setIsAddingNew(false); }} className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded transition-colors text-[10px] font-medium shadow-sm">確定</button>
          </div>
        </div>
      )}
    </div>
  );
};
