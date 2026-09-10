import React, { useState, useRef, useMemo, useEffect } from 'react';
import { IconDownload } from '../icons/Icons.jsx';

export const ExportModal = ({ isOpen, onClose, onConfirm }) => {
  const [fileName, setFileName] = useState('');
  useEffect(() => { if (isOpen) { const now = new Date(); const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`; setFileName(`${dateStr}_展開図.json`); } }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onPointerDown={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 animate-in fade-in zoom-in-95 duration-200" onPointerDown={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><IconDownload size={20} className="text-blue-500" />ファイルを保存</h3>
        <div className="space-y-4 mb-6"><div><label className="block text-xs font-semibold text-slate-500 mb-1">ファイル名</label><input autoFocus type="text" value={fileName} onChange={e => setFileName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onConfirm(fileName); if (e.key === 'Escape') onClose(); }} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 text-sm" /></div></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">キャンセル</button><button onClick={() => onConfirm(fileName)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">保存</button></div>
      </div>
    </div>
  );
};
