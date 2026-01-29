
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Camera, Image as ImageIcon, Heart, CreditCard, Calendar, Calculator, Scale, Check } from 'lucide-react';
import { processAIInput, processReceiptImage } from '../services/gemini';
import { Transaction, Category, Member } from '../types';

interface AIInputProps {
  onAddTransaction: (t: Partial<Transaction>) => void;
  setIsAIProcessing: (loading: boolean) => void;
  members: Member[];
  currentUserId: string;
  state: any; // 獲取 categories
}

const AIInput: React.FC<AIInputProps & { categories: string[] }> = ({ onAddTransaction, setIsAIProcessing, members, currentUserId, categories }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingRecord, setPendingRecord] = useState<Partial<Transaction> | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setIsAIProcessing(isLoading); }, [isLoading, setIsAIProcessing]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const handleTextSubmit = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await processAIInput(inputText, categories);
      const amount = Number(result.amount) || 0;
      setPendingRecord({
        item: result.description || '記帳項目',
        merchant: result.merchant || '商家',
        amount: amount,
        type: (result.type === '收入' ? '收入' : '支出'),
        category: result.category || categories[categories.length - 1],
        date: result.date || new Date().toISOString().split('T')[0],
        payerId: currentUserId,
        isSplit: true,
        splitType: 'equal',
        splitWith: members.map(m => m.id),
        splitDetails: {}
      });
      setInputText('');
    } catch (e: any) { 
      alert('辨識出錯了，請再試一次！'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await processReceiptImage(base64, file.type, categories);
        const amount = Number(result.amount) || 0;
        setPendingRecord({
          item: result.description || '辨識項目',
          merchant: result.merchant || '辨識商家',
          amount: amount,
          type: (result.type === '收入' ? '收入' : '支出'),
          category: result.category || categories[categories.length - 1],
          date: result.date || new Date().toISOString().split('T')[0],
          payerId: currentUserId,
          isSplit: true,
          splitType: 'equal',
          splitWith: members.map(m => m.id),
          splitDetails: {}
        });
        setIsLoading(false);
      };
    } catch (err) {
      setIsLoading(false);
      alert('辨識失敗');
    } finally {
      e.target.value = '';
    }
  };

  const toggleSplitMember = (memberId: string) => {
    if (!pendingRecord) return;
    const currentSplit = pendingRecord.splitWith || [];
    let nextSplit: string[];
    if (currentSplit.includes(memberId)) {
      if (currentSplit.length > 1) {
        nextSplit = currentSplit.filter(id => id !== memberId);
      } else return;
    } else {
      nextSplit = [...currentSplit, memberId];
    }
    setPendingRecord({ ...pendingRecord, splitWith: nextSplit, isSplit: nextSplit.length > 1 });
  };

  const handleCustomSplitChange = (memberId: string, value: string) => {
    if (!pendingRecord) return;
    const details = { ...(pendingRecord.splitDetails || {}) };
    details[memberId] = Number(value) || 0;
    setPendingRecord({ ...pendingRecord, splitDetails: details });
  };

  const getMemberEmoji = (name: string) => name.includes('Mandy') ? '💝' : '🐽';
  const customTotal = pendingRecord?.splitDetails 
    ? pendingRecord.splitWith?.reduce((sum, id) => sum + (pendingRecord.splitDetails?.[id] || 0), 0) || 0
    : 0;
  const diff = (pendingRecord?.amount || 0) - customTotal;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full relative bg-white border-[3px] border-[#2D1B1B] rounded-[1.8rem] overflow-hidden pig-shadow-sm">
        <textarea 
          ref={textareaRef}
          rows={1}
          placeholder="今天花/賺了什麼？"
          disabled={isLoading}
          className="w-full px-5 py-4 text-lg font-bold focus:outline-none placeholder:text-slate-300 disabled:opacity-50 resize-none pr-16 block bg-transparent"
          style={{ minHeight: '60px' }}
          value={inputText}
          onChange={e => setInputText(e.target.value)}
        />
        <button 
          onClick={handleTextSubmit} 
          disabled={isLoading || !inputText.trim()}
          className="absolute right-2.5 bottom-2 p-2.5 bg-[var(--pig-primary)] border-[2px] border-[#2D1B1B] rounded-full text-[#2D1B1B] active:translate-y-0.5 transition-all disabled:opacity-20 shadow-sm"
        >
          {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} strokeWidth={3} />}
        </button>
      </div>
      
      <div className="flex gap-6 justify-center w-full">
        <button onClick={() => galleryInputRef.current?.click()} className="h-14 w-14 bg-white border-[3px] border-[#2D1B1B] rounded-full flex items-center justify-center text-[#2D1B1B] pig-shadow-sm active:scale-90 transition-all">
          <ImageIcon size={24} strokeWidth={3} />
        </button>
        <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <button onClick={() => cameraInputRef.current?.click()} className="h-14 w-14 bg-white border-[3px] border-[#2D1B1B] rounded-full flex items-center justify-center text-[#2D1B1B] pig-shadow-sm active:scale-90 transition-all">
          <Camera size={24} strokeWidth={3} />
        </button>
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      </div>

      {pendingRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-5 bg-[#2D1B1B]/50 backdrop-blur-sm animate-backdrop">
          <div className="bg-white border-[4px] border-[#2D1B1B] rounded-[2.5rem] w-full max-w-sm p-5 pig-shadow relative overflow-hidden animate-pop-in">
            <h3 className="font-black text-xl mb-3 text-center text-[#2D1B1B]">確認帳單 🐽</h3>
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto no-scrollbar pr-1 pb-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">日期</label>
                  <input type="date" className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B]" value={pendingRecord.date} onChange={e => setPendingRecord({...pendingRecord, date: e.target.value})} />
                </div>
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">店家</label>
                  <input className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B]" value={pendingRecord.merchant} onChange={e => setPendingRecord({...pendingRecord, merchant: e.target.value})} />
                </div>
              </div>

              <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">分類</label>
                <select 
                  className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B]"
                  value={pendingRecord.category}
                  onChange={e => setPendingRecord({...pendingRecord, category: e.target.value})}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">總額</label>
                <div className="flex items-center gap-1.5">
                   <span className="text-base font-black text-[var(--pig-primary)]">$</span>
                   <input type="number" className="w-full bg-transparent font-black text-2xl outline-none text-[#2D1B1B] tracking-tight" value={pendingRecord.amount} onChange={e => setPendingRecord({...pendingRecord, amount: Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">品項細節</label>
                <textarea className="w-full bg-transparent font-bold text-[13px] outline-none resize-none h-10 leading-tight text-[#2D1B1B]" value={pendingRecord.item} onChange={e => setPendingRecord({...pendingRecord, item: e.target.value})} />
              </div>

              <div className="bg-white p-2.5 rounded-xl border-[2px] border-[#2D1B1B] pig-shadow-sm">
                <label className="text-[9px] font-black text-[#2D1B1B] flex items-center gap-1.5 mb-1.5"><CreditCard size={9} className="text-[var(--pig-primary)]" /> 誰付款？</label>
                <div className="flex gap-2">
                  {members.map(m => (
                    <button key={m.id} onClick={() => setPendingRecord({...pendingRecord, payerId: m.id})} className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-[1.5px] transition-all ${pendingRecord.payerId === m.id ? 'bg-[var(--pig-primary)] border-[#2D1B1B]' : 'bg-slate-50 border-slate-200 opacity-40'}`}>
                      <span className="text-base">{getMemberEmoji(m.name)}</span>
                      <span className="font-black text-[11px] truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border-[2px] border-[#2D1B1B] pig-shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[9px] font-black text-[#2D1B1B] flex items-center gap-1.5"><Heart size={9} className="text-[var(--pig-primary)] fill-[var(--pig-primary)]" /> 誰分錢？</label>
                  <div className="flex bg-[var(--pig-secondary)] rounded-lg p-0.5 border-[1px] border-[#2D1B1B]/10">
                    <button onClick={() => setPendingRecord({...pendingRecord, splitType: 'equal'})} className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${pendingRecord.splitType === 'equal' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>平分</button>
                    <button onClick={() => setPendingRecord({...pendingRecord, splitType: 'custom'})} className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${pendingRecord.splitType === 'custom' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>自訂</button>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  {members.map(m => (
                    <button key={m.id} onClick={() => toggleSplitMember(m.id)} className={`flex-1 flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-[1.5px] transition-all ${pendingRecord.splitWith?.includes(m.id) ? 'bg-[var(--pig-primary)] border-[#2D1B1B]' : 'bg-slate-50 border-slate-200 opacity-40'}`}>
                      <span className="text-base">{getMemberEmoji(m.name)}</span>
                      <span className="font-black text-[11px] truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
                {pendingRecord.splitType === 'custom' && (
                  <div className="space-y-1.5 pt-1 animate-pop-in">
                    {pendingRecord.splitWith?.map(mid => (
                      <div key={mid} className="flex items-center justify-between bg-white p-2 rounded-lg border-[1.5px] border-[#2D1B1B]/10 shadow-sm">
                        <div className="flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-[var(--pig-secondary)] flex items-center justify-center text-[8px] border-[1px] border-[#2D1B1B]/5">{getMemberEmoji(members.find(m => m.id === mid)?.name || '')}</div>
                           <span className="font-black text-[11px] text-[#2D1B1B]">{members.find(m => m.id === mid)?.name}</span>
                        </div>
                        <div className="flex items-center gap-1 bg-[var(--pig-secondary)] px-2 py-1 rounded-md border-[1px] border-[#2D1B1B]/5">
                          <span className="text-[9px] font-black opacity-30">$</span>
                          <input type="number" className="bg-transparent text-right font-black text-xs w-16 outline-none" value={pendingRecord.splitDetails?.[mid] || ''} onChange={(e) => handleCustomSplitChange(mid, e.target.value)} placeholder="0" />
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-end gap-1.5 mt-2">
                       {diff === 0 ? <span className="text-[10px] font-black text-green-500 flex items-center gap-0.5"><Check size={10} strokeWidth={4} /> 金額平衡</span> : <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-md border-[1px] border-red-100">還差 ${Math.abs(diff)}</span>}
                    </div>
                  </div>
                )}
                {pendingRecord.splitType === 'equal' && pendingRecord.splitWith && pendingRecord.splitWith.length > 0 && (
                   <div className="text-center py-1.5 bg-[var(--pig-secondary)] rounded-lg border-[1px] border-dashed border-[#2D1B1B]/10">
                      <p className="text-[8px] font-black text-[#2D1B1B]/40">每人負擔</p>
                      <p className="text-sm font-black text-[#2D1B1B]">${Math.round(pendingRecord.amount / pendingRecord.splitWith.length)}</p>
                   </div>
                )}
              </div>
            </div>
            <div className="flex gap-2.5 mt-4">
              <button onClick={() => setPendingRecord(null)} className="flex-1 py-3 bg-white border-[2.5px] border-[#2D1B1B] rounded-xl font-black text-[#2D1B1B] active:translate-y-0.5 transition-all text-sm">取消</button>
              <button onClick={() => { onAddTransaction(pendingRecord); setPendingRecord(null); }} disabled={pendingRecord.splitType === 'custom' && diff !== 0} className={`flex-1 py-3 border-[2.5px] border-[#2D1B1B] rounded-xl font-black text-[#2D1B1B] pig-shadow-sm active:translate-y-0.5 transition-all text-sm ${pendingRecord.splitType === 'custom' && diff !== 0 ? 'bg-slate-100 opacity-50' : 'bg-[var(--pig-primary)]'}`}>確認送出</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInput;
