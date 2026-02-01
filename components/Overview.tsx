
import React from 'react';
import { Transaction, AppState, Category } from '../types';
import AIInput from './AIInput';
import { getCategoryIcon, getCategoryColorClass } from '../constants';
import { TrendingUp, ReceiptText, Heart } from 'lucide-react';

interface OverviewProps {
  state: AppState;
  onAddTransaction: (t: Partial<Transaction>) => void;
  setIsAIProcessing: (loading: boolean) => void;
  onEditTransaction: (id: string) => void;
}

const Overview: React.FC<OverviewProps> = ({ state, onAddTransaction, setIsAIProcessing, onEditTransaction }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const getInitial = (name: string | undefined | null) => {
    if (!name) return '?';
    const n = name.trim();
    if (n === '小豬' || n === '小') return '甫';
    return n.charAt(0).toUpperCase();
  };

  const todayExpenses = state.transactions.filter(t => t.type !== '收入' && t.date === todayStr);
  const todayTotal = todayExpenses.reduce((acc, t) => acc + t.amount, 0);
  
  const monthExpenses = state.transactions.filter(t => {
    if (t.type === '收入') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthTotal = monthExpenses.reduce((acc, t) => acc + t.amount, 0);

  // 排序邏輯：完全比照明細頁面
  const recentTransactions = [...state.transactions]
    .sort((a, b) => {
      // 1. 日期降序
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // 2. 同一天則按 rowIndex 降序（最新輸入的 row 在最後面，所以 rowIndex 越大越新）
      // 使用 ?? 確保 rowIndex 為 0 時不會被判斷成 999999
      const rowA = a.rowIndex ?? 999999;
      const rowB = b.rowIndex ?? 999999;
      return rowB - rowA;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-6">
      <section className="mt-2">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 bg-[var(--pig-primary)] rounded-full border-[2px] border-[#2D1B1B] flex items-center justify-center pig-shadow-sm rotate-[-5deg] shrink-0 transition-colors duration-300">
            <span className="text-lg emoji-pop">🐽</span>
          </div>
          <div>
            <h2 className="text-base font-black text-[#2D1B1B] tracking-tight leading-none">豬豬幫妳記</h2>
            <p className="text-[7px] font-black text-[var(--pig-primary)] uppercase tracking-[0.2em] mt-1 opacity-70 transition-colors duration-300">AI Smart Ledger</p>
          </div>
        </div>
        <div className="bg-white border-[2.5px] border-[#2D1B1B] rounded-[1.8rem] p-3.5 pig-shadow transition-colors duration-300">
          <AIInput 
            onAddTransaction={onAddTransaction} 
            members={state.members} 
            categories={state.categories}
            setIsAIProcessing={setIsAIProcessing} 
            currentUserId={state.currentUser}
            state={state}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 px-1">
        <div className="bg-[var(--pig-primary)] py-2.5 px-4 rounded-[1.4rem] text-[#2D1B1B] border-[2px] border-[#2D1B1B] pig-shadow-sm flex flex-col justify-center h-[68px] relative overflow-hidden group transition-colors duration-300">
          <div className="flex items-center gap-1.5 relative z-10"><TrendingUp size={11} strokeWidth={4} className="opacity-60" /><span className="text-[9px] font-black uppercase tracking-wider opacity-60">今日支出</span></div>
          <div className="text-2xl font-black tracking-tighter relative z-10 leading-none mt-1"><span className="text-xs mr-0.5">$</span>{Math.round(todayTotal).toLocaleString()}</div>
          <div className="absolute -right-2 -bottom-2 text-3xl opacity-10 rotate-12 group-hover:scale-110 transition-transform">💰</div>
        </div>
        <div className="bg-white py-2.5 px-4 rounded-[1.4rem] text-[#2D1B1B] border-[2px] border-[#2D1B1B] pig-shadow-sm flex flex-col justify-center h-[68px] relative overflow-hidden group transition-colors duration-300">
          <div className="flex items-center gap-1.5 text-[var(--pig-primary)] relative z-10 transition-colors duration-300"><Heart size={11} fill="currentColor" strokeWidth={0} /><span className="text-[9px] font-black uppercase tracking-wider">本月支出</span></div>
          <div className="text-2xl font-black tracking-tighter relative z-10 leading-none mt-1"><span className="text-xs mr-0.5 text-[var(--pig-primary)] transition-colors duration-300">$</span>{Math.round(monthTotal).toLocaleString()}</div>
          <div className="absolute -right-2 -bottom-2 text-3xl opacity-5 rotate-[-12deg] group-hover:scale-110 transition-transform">💖</div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3.5 px-2"><h3 className="text-base font-black flex items-center gap-2"><ReceiptText size={18} className="text-[var(--pig-primary)] transition-colors duration-300" strokeWidth={3} /> 最近記帳</h3></div>
        <div className="space-y-4 px-0.5">
          {recentTransactions.map(t => (
            <div key={t.id} onClick={() => onEditTransaction(t.id)} className="bg-white border-[2px] border-[#2D1B1B] p-3.5 rounded-[1.6rem] flex flex-col gap-2.5 pig-shadow active:translate-x-0.5 transition-all cursor-pointer relative">
              <div className="flex items-start gap-2.5">
                <div className={`w-10 h-10 rounded-full border-[2px] border-[#2D1B1B] flex items-center justify-center shrink-0 ${getCategoryColorClass(t.category)}`}>{getCategoryIcon(t.category)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap"><span className="font-black text-lg text-[#2D1B1B] leading-none truncate">{t.merchant}</span><span className="text-[10px] font-bold text-slate-300 ml-auto">{t.date.split('-').slice(1).join('/')}</span></div>
                  <div className="text-base font-bold text-slate-500 leading-snug break-words overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.item}</div>
                </div>
                <div className="text-right shrink-0"><div className="font-black text-3xl text-[#2D1B1B] tracking-tighter leading-none"><span className="text-sm mr-0.5 opacity-20">$</span>{Math.round(t.amount).toLocaleString()}</div></div>
              </div>
              <div className="pt-2.5 border-t-[1.5px] border-dashed border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[12px] font-black text-[#2D1B1B]/50 transition-colors duration-300">
                    <span className="w-6 h-6 rounded-full bg-[var(--pig-primary)] border-[1.5px] border-[#2D1B1B] flex items-center justify-center text-[#2D1B1B] text-[10px] font-black shadow-sm transition-colors duration-300">{getInitial(state.members.find(m => m.id === t.payerId)?.name)}</span>
                    {state.members.find(m => m.id === t.payerId)?.name} 付款
                  </div>
                  {t.isSplit && (
                    <div className="flex items-center gap-2 bg-[var(--pig-secondary)] border-[2px] border-[#2D1B1B] pl-2 pr-1.5 py-0.5 rounded-full pig-shadow-sm h-9 transition-colors duration-300">
                      <div className="flex items-center gap-1.5 pr-1.5 border-r-[1.5px] border-[#2D1B1B]/10"><Heart size={16} className="text-[var(--pig-primary)] fill-[var(--pig-primary)] animate-pulse transition-colors duration-300" /><span className="text-[12px] font-black text-[#2D1B1B] tracking-tight">平分</span></div>
                      <div className="flex -space-x-2">{t.splitWith.map(mid => (<div key={mid} className="w-7 h-7 rounded-full bg-white border-[2px] border-[#2D1B1B] flex items-center justify-center text-[12px] font-black text-[#2D1B1B] ring-2 ring-white shadow-sm z-10 transition-transform active:z-20">{getInitial(state.members.find(m => m.id === mid)?.name)}</div>))}</div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Overview;
