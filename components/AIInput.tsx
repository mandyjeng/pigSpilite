
import { Transaction, Member } from '../types';
import * as React from 'react';
import * as Lucide from 'lucide-react';
import { processAIInput, processReceiptImage } from '../services/aiService';//注意//注意
import { getMemberEmoji } from '../constants';

interface AIInputProps {
  onAddTransaction: (t: Partial<Transaction>) => void;
  setIsAIProcessing: (loading: boolean) => void;
  members: Member[];
  currentUserId: string;
  state: any;
  categories: string[];
}

const AIInput: React.FC<AIInputProps> = ({ onAddTransaction, setIsAIProcessing, members = [], currentUserId, categories = [] }) => {
  const [inputText, setInputText] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [pendingRecord, setPendingRecord] = React.useState<Partial<Transaction> | null>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => { setIsAIProcessing(isLoading); }, [isLoading, setIsAIProcessing]);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [inputText]);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeMembers = Array.isArray(members) ? members : [];

  const handleTextSubmit = async () => {
    if (!inputText.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const result = await processAIInput(inputText, safeCategories);
      const amount = Number(result.amount) || 0;
      const defaultSplitWith = safeMembers.map(m => m.id);
      setPendingRecord({
        item: result.description || '記帳項目',
        merchant: result.merchant || '商家',
        amount: amount,
        type: (result.type === '收入' ? '收入' : '支出'),
        category: result.category || (safeCategories.length > 0 ? safeCategories[0] : '其他'),
        date: result.date || new Date().toISOString().split('T')[0],
        payerId: currentUserId,
        isSplit: defaultSplitWith.length > 1,
        splitType: 'equal',
        splitWith: defaultSplitWith,
        splitDetails: {},
        mapUrl: ''
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
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const result = await processReceiptImage(base64, file.type, safeCategories);
          const amount = Number(result.amount) || 0;
          const defaultSplitWith = safeMembers.map(m => m.id);
          setPendingRecord({
            item: result.description || '辨識項目',
            merchant: result.merchant || '辨識商家',
            amount: amount,
            type: (result.type === '收入' ? '收入' : '支出'),
            category: result.category || (safeCategories.length > 0 ? safeCategories[0] : '其他'),
            date: result.date || new Date().toISOString().split('T')[0],
            payerId: currentUserId,
            isSplit: defaultSplitWith.length > 1,
            splitType: 'equal',
            splitWith: defaultSplitWith,
            splitDetails: {},
            mapUrl: ''
          });
        } catch (innerErr) {
          alert('AI 辨識圖片失敗');
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsLoading(false);
      alert('讀取檔案失敗');
    } finally {
      e.target.value = '';
    }
  };

  const openGoogleMap = () => {
    if (!pendingRecord) return;
    const url = pendingRecord.mapUrl && pendingRecord.mapUrl.startsWith('http') 
      ? pendingRecord.mapUrl 
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pendingRecord.merchant || '')}`;
    window.open(url, '_blank');
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
  
  const customTotal = React.useMemo(() => {
    return (pendingRecord?.splitWith || []).reduce((sum, id) => {
      return sum + (pendingRecord?.splitDetails?.[id] || 0);
    }, 0);
  }, [pendingRecord?.splitWith, pendingRecord?.splitDetails]);
  
  const diff = (pendingRecord?.amount || 0) - customTotal;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
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
          {isLoading ? <Lucide.Loader2 size={20} className="animate-spin" /> : <Lucide.Send size={20} strokeWidth={3} />}
        </button>
      </div>
      
      <div className="flex gap-6 justify-center w-full">
        <button onClick={() => galleryInputRef.current?.click()} className="h-14 w-14 bg-white border-[3px] border-[#2D1B1B] rounded-full flex items-center justify-center text-[#2D1B1B] pig-shadow-sm active:scale-90 transition-all">
          <Lucide.Image size={24} strokeWidth={3} />
        </button>
        <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        <button onClick={() => cameraInputRef.current?.click()} className="h-14 w-14 bg-white border-[3px] border-[#2D1B1B] rounded-full flex items-center justify-center text-[#2D1B1B] pig-shadow-sm active:scale-90 transition-all">
          <Lucide.Camera size={24} strokeWidth={3} />
        </button>
        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
      </div>

      {pendingRecord && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-5 bg-[#2D1B1B]/50 backdrop-blur-sm animate-backdrop">
          <div className="bg-white border-[4px] border-[#2D1B1B] rounded-[2.5rem] w-full max-sm p-5 pig-shadow relative overflow-hidden animate-pop-in">
             <div className="flex justify-between items-center mb-3">
               <div className="w-8" />
               <h3 className="font-black text-xl text-center text-[#2D1B1B]">確認帳單 🐽</h3>
               <button onClick={() => setPendingRecord(null)} className="text-slate-300 hover:text-red-500 transition-colors">
                  <Lucide.X size={24} strokeWidth={4} />
               </button>
             </div>

            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto no-scrollbar pr-1 pb-2 px-1">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">日期</label>
                  <input type="date" className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B]" value={pendingRecord.date || ''} onChange={e => setPendingRecord({...pendingRecord, date: e.target.value})} />
                </div>
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B] relative pr-10">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">店家</label>
                  <input className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B]" value={pendingRecord.merchant || ''} onChange={e => setPendingRecord({...pendingRecord, merchant: e.target.value})} />
                  <button onClick={openGoogleMap} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[var(--pig-primary)] rounded-lg border-[1px] border-[#2D1B1B] text-[#2D1B1B] shadow-sm active:scale-90 transition-all">
                    <Lucide.MapPin size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">分類</label>
                  <select 
                    className="w-full bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B] truncate"
                    value={pendingRecord.category || ''}
                    onChange={e => setPendingRecord({...pendingRecord, category: e.target.value})}
                  >
                    {safeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                  <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">總額</label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-[var(--pig-primary)]">$</span>
                    <input type="number" className="w-full bg-transparent font-black text-lg outline-none text-[#2D1B1B] tracking-tight" value={pendingRecord.amount || 0} onChange={e => setPendingRecord({...pendingRecord, amount: Number(e.target.value)})} />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--pig-secondary)] p-2.5 rounded-xl border-[2px] border-[#2D1B1B]">
                <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">品項細節</label>
                <textarea className="w-full bg-transparent font-bold text-[13px] outline-none resize-none min-h-[80px] leading-tight text-[#2D1B1B]" value={pendingRecord.item || ''} onChange={e => setPendingRecord({...pendingRecord, item: e.target.value})} />
              </div>

              <div className="bg-white p-2.5 rounded-xl border-[2px] border-[#2D1B1B] pig-shadow-sm">
                <label className="text-[9px] font-black text-[#2D1B1B] flex items-center gap-1.5 mb-1.5">
                  <Lucide.CreditCard size={9} className="text-[var(--pig-primary)]" /> 誰付款？
                </label>
                <div className="flex gap-2">
                  {safeMembers.map(m => (
                    <button key={m.id} onClick={() => setPendingRecord({...pendingRecord, payerId: m.id})} className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border-[1.5px] transition-all ${pendingRecord.payerId === m.id ? 'bg-[var(--pig-primary)] border-[#2D1B1B]' : 'bg-slate-50 border-slate-200 opacity-40 grayscale'}`}>
                      <span className="text-base">{getMemberEmoji(m.name)}</span>
                      <span className="font-black text-[11px] truncate">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border-[2px] border-[#2D1B1B] pig-shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-black text-[#2D1B1B] flex items-center gap-1.5">
                    <Lucide.Heart size={10} className="text-[var(--pig-primary)] fill-[var(--pig-primary)]" /> 誰分錢？
                  </label>
                  <div className="flex bg-[var(--pig-secondary)] rounded-lg p-0.5 border-[1px] border-[#2D1B1B]/10">
                    <button onClick={() => setPendingRecord({...pendingRecord, splitType: 'equal'})} className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${pendingRecord.splitType === 'equal' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>平分</button>
                    <button onClick={() => setPendingRecord({...pendingRecord, splitType: 'custom'})} className={`px-2 py-0.5 rounded-md text-[9px] font-black transition-all ${pendingRecord.splitType === 'custom' ? 'bg-[var(--pig-primary)] text-[#2D1B1B]' : 'text-slate-400'}`}>自訂</button>
                  </div>
                </div>
                
                <div className="flex gap-2 mb-4">
                  {safeMembers.map(m => (
                    <button key={m.id} onClick={() => toggleSplitMember(m.id)} className={`flex-1 flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl border-[2px] transition-all ${pendingRecord.splitWith?.includes(m.id) ? 'bg-[var(--pig-primary)] border-[#2D1B1B] pig-shadow-sm' : 'bg-slate-50 border-slate-200 opacity-30 grayscale'}`}>
                      <span className="text-xl">{getMemberEmoji(m.name)}</span>
                      <span className="font-black text-[12px]">{m.name}</span>
                    </button>
                  ))}
                </div>

                {pendingRecord.splitType === 'custom' && (
                  <div className="space-y-2.5 pt-1 animate-pop-in">
                    {(pendingRecord.splitWith || []).map(mid => {
                      const m = safeMembers.find(mem => mem.id === mid);
                      return (
                        <div key={mid} className="flex items-center justify-between bg-white px-3 py-2.5 rounded-2xl border-[2px] border-[#2D1B1B]/10 shadow-sm">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-[var(--pig-secondary)] flex items-center justify-center text-sm border-[1px] border-[#2D1B1B]/5">{getMemberEmoji(m?.name || '')}</div>
                             <span className="font-black text-sm text-[#2D1B1B]">{m?.name}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-[var(--pig-secondary)] px-4 py-1.5 rounded-xl border-[1px] border-[#2D1B1B]/10">
                            <span className="text-[11px] font-black opacity-30">$</span>
                            <input 
                              type="number" 
                              className="bg-transparent text-right font-black text-base w-20 outline-none text-[#2D1B1B]" 
                              value={pendingRecord.splitDetails?.[mid] || ''} 
                              onChange={(e) => handleCustomSplitChange(mid, e.target.value)} 
                              placeholder="0"
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-end gap-1.5 mt-3">{diff === 0 ? <span className="text-[11px] font-black text-green-500 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border-[1.5px] border-green-100"><Lucide.Check size={12} strokeWidth={4} /> 平衡</span> : <span className="text-[11px] font-black text-red-500 bg-red-50 px-3 py-1 rounded-full border-[1.5px] border-red-100">差 ${Math.abs(diff).toLocaleString()}</span>}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5">
              <button 
                onClick={() => { onAddTransaction(pendingRecord); setPendingRecord(null); }} 
                disabled={pendingRecord.splitType === 'custom' && diff !== 0}
                className={`w-full py-4 border-[3px] border-[#2D1B1B] rounded-2xl font-black text-xl pig-shadow active:translate-y-1 active:shadow-none transition-all ${pendingRecord.splitType === 'custom' && diff !== 0 ? 'bg-slate-100 opacity-50' : 'bg-[var(--pig-primary)] text-[#2D1B1B]'}`}
              >
                豬豬請記好 🐷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInput;
