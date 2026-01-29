
import React, { useState, useEffect } from 'react';
import { Transaction, Category, AppState } from '../types';
import { getCategoryIcon, getCategoryColorClass } from '../constants';
import { Search, Trash2, Calendar, RefreshCw, X, Save, Clock, Loader2, Heart, AlertCircle, CreditCard, Filter, Check } from 'lucide-react';
import { updateTransactionInSheet } from '../services/sheets';

interface DetailsProps {
  state: AppState;
  onDeleteTransaction: (id: string) => Promise<void>;
  updateState: (updates: any) => void;
  onSync: () => void;
  isSyncing: boolean;
  initialEditId?: string | null;
  onClearInitialEdit?: () => void;
}

const Details: React.FC<DetailsProps> = ({ state, onDeleteTransaction, updateState, onSync, isSyncing, initialEditId, onClearInitialEdit }) => {
  const [filterCategory, setFilterCategory] = useState<Category | '全部'>('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const clearDateFilter = () => { setStartDate(''); setEndDate(''); };

  useEffect(() => {
    if (initialEditId) {
      const target = state.transactions.find(t => t.id === initialEditId);
      if (target) setEditingItem(target);
      onClearInitialEdit?.();
    }
  }, [initialEditId, state.transactions, onClearInitialEdit]);

  const handleSaveEdit = async () => {
    if (!editingItem || isSaving || isDeleting) return;
    setIsSaving(true);
    try {
      const newList = state.transactions.map(t => t.id === editingItem.id ? { ...editingItem } : t);
      updateState({ transactions: newList });
      if (state.sheetUrl && editingItem.rowIndex !== undefined) {
        await updateTransactionInSheet(state.sheetUrl, editingItem);
      }
      setEditingItem(null);
    } catch (error) {
      alert('儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!editingItem || isDeleting || isSaving) return;
    setIsDeleting(true);
    try {
      await onDeleteTransaction(editingItem.id);
      setShowDeleteConfirm(false);
      setEditingItem(null);
    } catch (error) {
      alert('刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSplitMember = (memberId: string) => {
    if (!editingItem) return;
    const currentSplit = editingItem.splitWith || [];
    let nextSplit = currentSplit.includes(memberId) ? currentSplit.filter(id => id !== memberId) : [...currentSplit, memberId];
    if (nextSplit.length === 0) return;
    setEditingItem({ ...editingItem, splitWith: nextSplit, isSplit: nextSplit.length > 1 });
  };

  // Fix: Added missing handleCustomSplitChange function
  const handleCustomSplitChange = (memberId: string, value: string) => {
    if (!editingItem) return;
    const details = { ...(editingItem.splitDetails || {}) };
    details[memberId] = Number(value) || 0;
    setEditingItem({ ...editingItem, splitDetails: details });
  };

  const filteredTransactions = state.transactions
    .filter(t => filterCategory === '全部' || t.category === filterCategory)
    .filter(t => t.item.toLowerCase().includes(searchQuery.toLowerCase()) || t.merchant.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(t => (startDate ? t.date >= startDate : true) && (endDate ? t.date <= endDate : true))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const dates = Array.from(new Set(filteredTransactions.map(t => t.date))) as string[];
  const diff = editingItem ? editingItem.amount - (editingItem.splitWith?.reduce((sum, id) => sum + (editingItem.splitDetails?.[id] || 0), 0) || 0) : 0;
  const getWeekday = (d: string) => new Date(d).toLocaleDateString('zh-TW', { weekday: 'long' });
  const getInitial = (n: string | any) => n?.trim().charAt(0) || '?';
  const getMemberEmoji = (n: string) => n.includes('Mandy') ? '💝' : '🐽';

  return (
    <div className="relative">
      <div className="sticky top-[164px] z-40 bg-[var(--pig-bg)] -mx-5 px-5 pb-2 transition-colors duration-300">
        <div className="bg-white border-[2px] border-[#2D1B1B] rounded-[1.4rem] p-2.5 pig-shadow-sm flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pig-primary)]" size={14} />
              <input type="text" placeholder="搜尋項目或商家..." className="w-full bg-[var(--pig-secondary)] rounded-lg py-1.5 pl-8 pr-3 text-[13px] font-bold outline-none" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={onSync} disabled={isSyncing} className="bg-white border-[2px] border-[#2D1B1B] w-8 h-8 rounded-lg flex items-center justify-center active:scale-95 disabled:opacity-50 shrink-0"><RefreshCw size={16} className={isSyncing ? "animate-spin text-[var(--pig-primary)]" : "text-[#2D1B1B]"} /></button>
          </div>
          <div className="flex overflow-x-auto gap-1.5 no-scrollbar">
              {['全部', ...state.categories].map(c => (
                <button key={c} onClick={() => setFilterCategory(c)} className={`px-3 py-1 rounded-full text-[11px] font-black transition-all border-[1.5px] whitespace-nowrap ${filterCategory === c ? 'bg-[#2D1B1B] text-white border-[#2D1B1B]' : 'bg-white text-[#2D1B1B] border-[#2D1B1B]/10'}`}>{c}</button>
              ))}
          </div>
        </div>
      </div>

      <div className="space-y-8 mt-2">
        {dates.length > 0 ? dates.map(date => (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-white border-[2px] border-[#2D1B1B] px-3 py-1 rounded-full flex items-center gap-1.5 z-10 pig-shadow-sm"><Calendar size={12} strokeWidth={3} className="text-[var(--pig-primary)]" /><span className="text-[12px] font-black text-[#2D1B1B]">{date} <span className="text-slate-300 ml-1">{getWeekday(date).slice(0, 3)}</span></span></div>
              <div className="flex-1 h-[1.5px] bg-[var(--pig-secondary)]"></div>
            </div>
            <div className="space-y-3 px-0.5">
              {filteredTransactions.filter(t => t.date === date).map(t => (
                <div key={t.id} onClick={() => setEditingItem(t)} className="bg-white border-[2px] border-[#2D1B1B] p-3.5 rounded-[1.6rem] flex flex-col gap-2.5 pig-shadow active:translate-x-0.5 transition-all cursor-pointer">
                  <div className="flex items-start gap-2.5">
                    <div className={`w-10 h-10 rounded-full border-[2px] border-[#2D1B1B] flex items-center justify-center shrink-0 ${getCategoryColorClass(t.category)}`}>{getCategoryIcon(t.category)}</div>
                    <div className="flex-1 min-w-0"><div className="flex items-center gap-1.5 mb-1"><span className="font-black text-lg text-[#2D1B1B] leading-none truncate">{t.merchant}</span></div><div className="text-base font-bold text-slate-500 leading-snug break-words overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.item}</div></div>
                    <div className="text-right shrink-0"><div className="font-black text-3xl text-[#2D1B1B] tracking-tighter leading-none"><span className="text-sm mr-0.5 opacity-20">$</span>{Math.round(t.amount).toLocaleString()}</div></div>
                  </div>
                  <div className="pt-2.5 border-t-[1.5px] border-dashed border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] font-black text-[#2D1B1B]/50 transition-colors duration-300"><span className="w-6 h-6 rounded-full bg-[var(--pig-primary)] border-[1.5px] border-[#2D1B1B] flex items-center justify-center text-[#2D1B1B] text-[10px] font-black shadow-sm">{getInitial(state.members.find(m => m.id === t.payerId)?.name)}</span>{state.members.find(m => m.id === t.payerId)?.name} 付款</div>
                      {t.isSplit && (<div className="flex items-center gap-2 bg-[var(--pig-secondary)] border-[2px] border-[#2D1B1B] pl-2 pr-1.5 py-0.5 rounded-full h-9"><div className="flex items-center gap-1.5 pr-1.5 border-r-[1.5px] border-[#2D1B1B]/10"><Heart size={16} className="text-[var(--pig-primary)] fill-[var(--pig-primary)] animate-pulse" /><span className="text-[12px] font-black text-[#2D1B1B] tracking-tight">{t.splitType === 'equal' ? '平分' : '自訂'}</span></div><div className="flex -space-x-2">{t.splitWith.map(mid => (<div key={mid} className="w-7 h-7 rounded-full bg-white border-[2px] border-[#2D1B1B] flex items-center justify-center text-[12px] font-black text-[#2D1B1B] ring-2 ring-white shadow-sm z-10">{getInitial(state.members.find(m => m.id === mid)?.name)}</div>))}</div></div>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : <div className="py-20 text-center opacity-10"><div className="text-6xl mb-4">🐽</div><p className="font-black text-lg">No Data</p></div>}
      </div>

      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#2D1B1B]/70 backdrop-blur-md animate-backdrop">
          <div className="bg-white border-[3px] border-[#2D1B1B] rounded-[2.2rem] w-full max-w-md p-5 pig-shadow relative animate-pop-in">
            <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-black flex items-center gap-2 text-[#2D1B1B]"><Clock className="text-[var(--pig-primary)]" size={24} strokeWidth={4} /> 編輯</h3><button onClick={() => setEditingItem(null)} className="p-1 text-slate-300 hover:text-[#2D1B1B] transition-colors"><X size={28} strokeWidth={4} /></button></div>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto no-scrollbar pb-2 px-0.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--pig-secondary)] p-3 rounded-xl border-[2px] border-[#2D1B1B]"><label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">日期</label><input type="date" className="w-full bg-transparent font-black text-base outline-none text-[#2D1B1B]" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} /></div>
                <div className="bg-[var(--pig-secondary)] p-3 rounded-xl border-[2px] border-[#2D1B1B]"><label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">店家</label><input className="w-full bg-transparent font-black text-base outline-none text-[#2D1B1B]" value={editingItem.merchant} onChange={e => setEditingItem({...editingItem, merchant: e.target.value})} /></div>
              </div>
              <div className="bg-[var(--pig-secondary)] p-3 rounded-xl border-[2px] border-[#2D1B1B] transition-colors duration-300">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-0.5 block">分類</label>
                <select className="w-full bg-transparent font-black text-base outline-none text-[#2D1B1B]" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}>
                  {state.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="bg-[var(--pig-secondary)] p-3 rounded-xl border-[2px] border-[#2D1B1B]"><label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">總額</label><div className="flex items-center gap-1.5"><span className="text-xl font-black text-[var(--pig-primary)]">$</span><input type="number" className="w-full bg-transparent font-black text-2xl outline-none text-[#2D1B1B] tracking-tight" value={editingItem.amount} onChange={e => setEditingItem({...editingItem, amount: Number(e.target.value)})} /></div></div>
              <div className="bg-[var(--pig-secondary)] p-3 rounded-xl border-[2px] border-[#2D1B1B]"><label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">品項細節</label><textarea className="w-full bg-transparent font-black text-[13px] outline-none text-[#2D1B1B] min-h-[60px] resize-none leading-tight" value={editingItem.item} onChange={e => setEditingItem({...editingItem, item: e.target.value})} /></div>
              <div className="bg-white p-3 rounded-xl border-[2px] border-[#2D1B1B] pig-shadow-sm"><label className="text-[9px] font-black text-[#2D1B1B] flex items-center gap-1.5 mb-2"><CreditCard size={10} className="text-[var(--pig-primary)]" /> 誰付款？</label><div className="flex gap-2">{state.members.map(m => (<button key={m.id} onClick={() => setEditingItem({...editingItem, payerId: m.id})} className={`flex-1 flex items-center gap-1.5 px-2 py-2 rounded-lg border-[1.5px] transition-all ${editingItem.payerId === m.id ? 'bg-[var(--pig-primary)] border-[#2D1B1B] shadow-sm' : 'bg-slate-50 border-slate-200 opacity-40 grayscale'}`}><span className="text-base">{getMemberEmoji(m.name)}</span><span className="font-black text-[11px] truncate">{m.name}</span></button>))}</div></div>
              <div className="bg-white p-3 rounded-xl border-[2px] border-[#2D1B1B] pig-shadow-sm"><div className="flex items-center justify-between mb-2"><label className="text-[9px] font-black text-[#2D1B1B] flex items-center gap-1.5"><Heart size={10} className="text-[var(--pig-primary)] fill-[var(--pig-primary)]" /> 誰分錢？</label><div className="flex bg-[var(--pig-secondary)] rounded-lg p-0.5 border-[1px] border-[#2D1B1B]/10"><button onClick={() => setEditingItem({...editingItem, splitType: 'equal'})} className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${editingItem.splitType === 'equal' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>平分</button><button onClick={() => setEditingItem({...editingItem, splitType: 'custom'})} className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${editingItem.splitType === 'custom' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>自訂</button></div></div>
                <div className="flex gap-2 mb-2">{state.members.map(m => (<button key={m.id} onClick={() => toggleSplitMember(m.id)} className={`flex-1 flex items-center gap-1.5 px-2 py-2 rounded-lg border-[1.5px] transition-all ${editingItem.splitWith?.includes(m.id) ? 'bg-[var(--pig-primary)] border-[#2D1B1B] shadow-sm' : 'bg-slate-50 border-slate-200 opacity-40 grayscale'}`}><span className="text-base">{getMemberEmoji(m.name)}</span><span className="font-black text-[11px] truncate">{m.name}</span></button>))}</div>
                {editingItem.splitType === 'custom' && (<div className="space-y-1.5 pt-1 animate-pop-in">{editingItem.splitWith?.map(mid => (<div key={mid} className="flex items-center justify-between bg-white p-2 rounded-lg border-[1.5px] border-[#2D1B1B]/10 shadow-sm"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-[var(--pig-secondary)] flex items-center justify-center text-[8px] border-[1px] border-[#2D1B1B]/5">{getMemberEmoji(state.members.find(m => m.id === mid)?.name || '')}</div><span className="font-black text-[11px] text-[#2D1B1B]">{state.members.find(m => m.id === mid)?.name}</span></div><div className="flex items-center gap-1 bg-[var(--pig-secondary)] px-2 py-1 rounded-md border-[1px] border-[#2D1B1B]/5"><span className="text-[9px] font-black opacity-30">$</span><input type="number" className="bg-transparent text-right font-black text-xs w-16 outline-none" value={editingItem.splitDetails?.[mid] || ''} onChange={(e) => handleCustomSplitChange(mid, e.target.value)} /></div></div>))}<div className="flex items-center justify-end gap-1.5 mt-2">{diff === 0 ? <span className="text-[10px] font-black text-green-500 flex items-center gap-0.5"><Check size={10} strokeWidth={4} /> 金額平衡</span> : <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md border-[1px] border-red-100">還差 ${Math.abs(diff)}</span>}</div></div>)}
              </div>
            </div>
            <div className="flex gap-2.5 mt-4"><button onClick={() => setShowDeleteConfirm(true)} className="p-3 bg-white border-[2px] border-[#2D1B1B] rounded-xl text-red-500 active:scale-95 transition-all"><Trash2 size={20} strokeWidth={4} /></button><button onClick={handleSaveEdit} disabled={isDeleting || isSaving || (editingItem.splitType === 'custom' && diff !== 0)} className={`flex-1 py-3 border-[2px] border-[#2D1B1B] text-[#2D1B1B] rounded-xl font-black text-lg pig-shadow flex items-center justify-center gap-2 active:translate-y-0.5 transition-all ${editingItem.splitType === 'custom' && diff !== 0 ? 'bg-slate-100 opacity-50' : 'bg-[var(--pig-primary)]'}`}>{isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={4} />}儲存變更</button></div>
          </div>
          {showDeleteConfirm && (<div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-[#2D1B1B]/40 backdrop-blur-sm animate-backdrop"><div className="bg-white border-[3px] border-[#2D1B1B] rounded-[2rem] w-full max-w-[280px] p-6 pig-shadow text-center animate-pop-in"><div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3 border-[2px] border-[#2D1B1B]"><AlertCircle size={28} strokeWidth={3} /></div><h4 className="font-black text-lg mb-1">確定刪除？</h4><p className="text-[12px] font-bold text-slate-400 mb-5">刪掉就回不來囉！</p><div className="w-full space-y-2.5"><button onClick={executeDelete} className="w-full py-3.5 bg-red-500 text-white border-[2px] border-[#2D1B1B] rounded-xl font-black text-base">確定刪除</button><button onClick={() => setShowDeleteConfirm(false)} className="w-full py-3.5 bg-white text-[#2D1B1B] border-[2px] border-[#2D1B1B] rounded-xl font-black text-base">取消</button></div></div></div>)}
        </div>
      )}
    </div>
  );
};

export default Details;
