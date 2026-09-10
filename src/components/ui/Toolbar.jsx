import React from 'react';
import * as Icons from '../icons/Icons.jsx';

export const Toolbar = ({ currentMode, setCurrentMode, onUndo, onRedo, canUndo, canRedo, onDelete, canDelete, onClearClick, onFitToView, onPrintClick, onExport, onImport, fileInputRef, cancelDraw }) => (
  <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-2 z-10 shadow-sm shrink-0 overflow-y-auto">
    <button onClick={() => { setCurrentMode('select'); cancelDraw(); }} className={`p-2.5 rounded-xl transition-colors ${currentMode === 'select' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="選択・移動・回転モード"><Icons.IconMousePointer2 size={24} /></button>
    <div className="h-px w-8 bg-slate-200 my-0.5"></div>
    <button onClick={() => { setCurrentMode('polygon'); cancelDraw(); }} className={`p-2.5 rounded-xl transition-colors ${currentMode === 'polygon' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="作図（ポリゴン）モード"><Icons.IconTriangle size={24} /></button>
    <button onClick={() => { setCurrentMode('line'); cancelDraw(); }} className={`p-2.5 rounded-xl transition-colors ${currentMode === 'line' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="補助線モード（直線）"><Icons.IconMinus size={24} /></button>
    <button onClick={() => { setCurrentMode('curve'); cancelDraw(); }} className={`p-2.5 rounded-xl transition-colors ${currentMode === 'curve' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="補助線モード（曲線）"><Icons.WaveIcon size={24} /></button>
    <button onClick={() => { setCurrentMode('text'); cancelDraw(); }} className={`p-2.5 rounded-xl transition-colors ${currentMode === 'text' ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="テキストモード"><Icons.IconType size={24} /></button>
    <div className="h-px w-8 bg-slate-200 my-0.5"></div>
    <button onClick={onUndo} disabled={!canUndo} className={`p-2.5 rounded-xl transition-colors ${canUndo ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`} title="元に戻す (Ctrl+Z)"><Icons.IconUndo2 size={24} /></button>
    <button onClick={onRedo} disabled={!canRedo} className={`p-2.5 rounded-xl transition-colors ${canRedo ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`} title="やり直し (Ctrl+Y)"><Icons.IconRedo2 size={24} /></button>
    <button onClick={onDelete} disabled={!canDelete} className={`p-2.5 rounded-xl transition-colors ${canDelete ? 'text-red-600 hover:bg-red-100' : 'text-slate-300 cursor-not-allowed'}`} title="選択した要素を削除 (Delete / Backspace)"><Icons.IconEraser size={24} /></button>
    <button onClick={onClearClick} className="p-2.5 rounded-xl text-red-500 hover:bg-red-100 transition-colors" title="すべてクリア"><Icons.IconTrash2 size={24} /></button>
    <div className="h-px w-8 bg-slate-200 my-0.5"></div>
    <button onClick={onFitToView} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="全体を表示"><Icons.IconMaximize size={24} /></button>
    <button onClick={onPrintClick} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="印刷・HTML出力"><Icons.IconPrinter size={24} /></button>
    <button onClick={onExport} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="保存 (JSON)"><Icons.IconDownload size={24} /></button>
    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors" title="読み込み (JSON)"><Icons.IconUpload size={24} /></button>
    <input type="file" ref={fileInputRef} onChange={onImport} accept=".json" className="hidden" />
  </div>
);
