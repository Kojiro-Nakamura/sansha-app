import React, { useState, useRef, useMemo, useEffect } from 'react';

export const ClearModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onPointerDown={onClose}>
      <div className="bg-white rounded-xl shadow-xl p-6 w-80 animate-in fade-in zoom-in-95 duration-200" onPointerDown={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2"><IconTrash2 size={20} className="text-red-500" />すべてクリア</h3>
        <p className="text-sm text-slate-600 mb-6">キャンバス上のすべての図形やテキストを消去します。この操作は元に戻せますが、よろしいですか？</p>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">キャンセル</button><button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm">クリアする</button></div>
      </div>
    </div>
  );
};
