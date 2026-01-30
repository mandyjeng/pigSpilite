
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, Transaction, Category, Member } from './types';
import { TABS } from './constants';
import Overview from './components/Overview';
import Details from './components/Details';
import Settings from './components/Settings';
import { fetchTransactionsFromSheet, fetchCategoriesFromSheet, saveToGoogleSheet, deleteTransactionFromSheet } from './services/sheets';

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyNMRpBKO4HYQrIwr3E984B7cUJNaDjQdr-KLDtWM2ykWXk6clvc_QlSGWS3f1GCBS-/exec";

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initialEditId, setInitialEditId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [state, setState] = useState<AppState>(() => {
    const defaultState: AppState = {
      members: [{ id: 'Mandy', name: 'Mandy' }, { id: '小豬', name: '小豬' }],
      categories: ['餐飲', '薪資', '娛樂', '購物', '其他'],
      transactions: [],
      currentUser: 'Mandy',
      theme: 'piggy',
      sheetUrl: SHEET_URL,
    };

    try {
      const saved = localStorage.getItem('piggy_ledger_simple');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...defaultState,
          ...parsed,
          members: Array.isArray(parsed.members) ? parsed.members : defaultState.members,
          categories: Array.isArray(parsed.categories) ? parsed.categories : defaultState.categories,
          transactions: Array.isArray(parsed.transactions) ? parsed.transactions : []
        };
      }
    } catch (e) {
      console.error("LocalStorage hydration failed:", e);
    }
    return defaultState;
  });

  useEffect(() => {
    localStorage.setItem('piggy_ledger_simple', JSON.stringify(state));
  }, [state]);

  const syncAll = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const [transactions, categories] = await Promise.all([
        fetchTransactionsFromSheet(SHEET_URL),
        fetchCategoriesFromSheet(SHEET_URL)
      ]);
      
      setState(prev => {
        const validCategories = (Array.isArray(categories) && categories.length > 0)
          ? categories 
          : prev.categories;

        return { 
          ...prev, 
          transactions: Array.isArray(transactions) ? transactions : [],
          categories: validCategories
        };
      });
    } catch (err: any) {
      setSyncError(err.message || '連線失敗');
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncAll();
  }, [syncAll]);

  const onAddTransaction = async (t: Partial<Transaction>) => {
    if (!t) return;

    const newTransaction: Transaction = {
      id: generateId(),
      date: t.date || new Date().toISOString().split('T')[0],
      item: t.item || '新紀錄',
      merchant: t.merchant || '商家',
      category: (t.category || '其他') as Category,
      amount: Number(t.amount) || 0,
      type: (t.type || '支出') as any,
      payerId: t.payerId || state.currentUser,
      isSplit: !!t.isSplit,
      splitType: t.splitType || 'equal',
      splitWith: Array.isArray(t.splitWith) ? t.splitWith : [state.currentUser],
      splitDetails: t.splitDetails || {},
      mapUrl: t.mapUrl || ''
    };

    setState(prev => ({ 
      ...prev, 
      transactions: [newTransaction, ...prev.transactions] 
    }));
    
    await saveToGoogleSheet(SHEET_URL, newTransaction);
    syncAll();
    setActiveTab('overview');
  };

  const onDeleteTransaction = async (id: string) => {
    setIsSyncing(true);
    try {
      const target = state.transactions.find(t => t.id === id);
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id)
      }));
      if (target?.rowIndex) {
        await deleteTransactionFromSheet(SHEET_URL, target.rowIndex);
      }
      await syncAll();
    } catch (error) {
      console.error("Delete operation failed:", error);
      await syncAll();
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className={`max-w-md mx-auto min-h-screen flex flex-col relative transition-colors duration-300 ${state.theme === 'matcha' ? 'theme-matcha bg-[var(--pig-bg)]' : 'bg-[#FFF9F9]'}`}>
      
      {(isAIProcessing || isSyncing) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#2D1B1B]/40 backdrop-blur-md transition-all duration-300">
          <div className="bg-white border-[4px] border-[#2D1B1B] rounded-[3.5rem] p-10 pig-shadow flex flex-col items-center gap-6 max-w-[280px] w-full mx-auto animate-pop-in">
            <div className="text-8xl animate-bounce emoji-pop">🐽</div>
            <div className="text-center space-y-2">
              <div className="font-black text-2xl text-[#2D1B1B] tracking-tight">
                {isSyncing ? "豬豬同步中..." : "AI 思考中..."}
              </div>
              <p className="text-sm font-bold text-slate-400">
                {isSyncing ? "正在與雲端豬圈連接" : "正在幫妳分析帳單細節"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-[60] bg-[var(--pig-bg)] pt-6 pb-2 h-[164px] flex flex-col justify-between transition-colors duration-300">
        <header className="px-5 flex justify-between items-center h-10">
          <h1 className="text-3xl font-black text-[#2D1B1B] flex items-center gap-2">
            豬豬帳本 <span className="text-2xl emoji-pop">🐽</span>
          </h1>
          <button 
            onClick={() => setState(prev => ({ ...prev, currentUser: prev.currentUser === '小豬' ? 'Mandy' : '小豬' }))}
            className="h-10 px-4 bg-white border-[3px] border-[#2D1B1B] rounded-full flex items-center gap-2 font-black pig-shadow-sm active:translate-y-0.5 transition-all"
          >
            <span className="text-xl emoji-pop">{state.currentUser === '小豬' ? '🐽' : '💝'}</span>
            <span className="text-[#2D1B1B] text-sm font-black">{state.currentUser}</span>
          </button>
        </header>

        <nav className="mx-5 bg-white border-[3px] border-[#2D1B1B] rounded-[1.6rem] p-1.5 flex relative pig-shadow-sm h-20 mb-2">
          <div 
            className="absolute top-1.5 bottom-1.5 bg-[var(--pig-primary)] border-[2.5px] border-[#2D1B1B] rounded-[1.2rem] transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{ 
              width: 'calc((100% - 12px) / 3)',
              left: `calc(6px + (${activeTabIndex} * (100% - 12px) / 3))`
            }}
          />
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`relative flex items-center justify-center gap-3 flex-1 transition-colors duration-200 z-10 ${
                activeTab === tab.id ? 'text-[#2D1B1B]' : 'text-slate-400'
              }`}
            >
              <span className={activeTab === tab.id ? 'scale-125 transition-transform' : ''}>{tab.icon}</span>
              <span className="text-xl font-black tracking-tight">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <main className="flex-1 px-5 pb-10">
        {activeTab === 'overview' && (
          <Overview 
            state={state} 
            onAddTransaction={onAddTransaction} 
            setIsAIProcessing={setIsAIProcessing} 
            onEditTransaction={(id) => { setInitialEditId(id); setActiveTab('details'); }}
          />
        )}
        {activeTab === 'details' && (
          <Details 
            state={state} 
            onDeleteTransaction={onDeleteTransaction} 
            updateState={updateState} 
            onSync={syncAll} 
            isSyncing={isSyncing}
            initialEditId={initialEditId}
            onClearInitialEdit={() => setInitialEditId(null)}
          />
        )}
        {activeTab === 'settings' && (
          <Settings 
            state={state} 
            updateState={updateState} 
            onReloadManagement={syncAll}
          />
        )}
      </main>
    </div>
  );
};

export default App;
