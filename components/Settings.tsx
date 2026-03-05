
import React from 'react';
import { AppState } from '@/types';
import { getMemberEmoji } from '@/constants';
import { UserCheck, Palette, RefreshCw, ExternalLink } from 'lucide-react';

interface SettingsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onReloadManagement: () => void;
}

const Settings: React.FC<SettingsProps> = ({ state, updateState, onReloadManagement }) => {
  return (
    <div className="space-y-8 pb-32">
      {/* 1. 資料同步 */}
      <section className="bg-white border-[3px] border-[#2D1B1B] rounded-[2.5rem] p-6 pig-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--pig-secondary)] text-[var(--pig-primary)] rounded-full flex items-center justify-center border-[2px] border-[#2D1B1B]">
              <RefreshCw size={20} strokeWidth={3} />
            </div>
            <h2 className="text-xl font-black text-[#2D1B1B]">雲端同步</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/12Ep8KfgXMZyBMIgu7DFFe5Wmty5YMg9y_FbJjbzHEZ8/edit?gid=2085058338#gid=2085058338', '_blank')}
              className="px-5 py-2.5 bg-white text-[#2D1B1B] rounded-2xl border-[2.5px] border-[#2D1B1B] font-black text-sm pig-shadow-sm active:translate-y-0.5 transition-all flex items-center gap-2"
            >
              <ExternalLink size={16} strokeWidth={3} />
              開啟帳本
            </button>
            <button 
              onClick={onReloadManagement}
              className="px-5 py-2.5 bg-[var(--pig-primary)] text-[#2D1B1B] rounded-2xl border-[2.5px] border-[#2D1B1B] font-black text-sm pig-shadow-sm active:translate-y-0.5 transition-all"
            >
              手動讀取
            </button>
          </div>
        </div>
        <div className="bg-[var(--pig-secondary)]/50 p-4 rounded-2xl border-[2px] border-dashed border-[#2D1B1B]/10">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed text-center">
            目前帳本連結至 Google Sheets<br/>點擊上方按鈕可強制從雲端抓取最新資料。
          </p>
        </div>
      </section>

      {/* 2. 切換身份 */}
      <section className="bg-white border-[3px] border-[#2D1B1B] rounded-[2.5rem] p-6 pig-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--pig-secondary)] text-[var(--pig-primary)] rounded-full flex items-center justify-center border-[2px] border-[#2D1B1B]">
            <UserCheck size={20} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-[#2D1B1B]">是誰在用？</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {state.members.map(m => {
            const isActive = state.currentUser === m.id;
            return (
              <button 
                key={m.id}
                onClick={() => updateState({ currentUser: m.id })}
                className={`group relative flex flex-col items-center justify-center gap-2 py-6 rounded-[2rem] border-[3px] transition-all pig-shadow-sm active:translate-y-1 active:shadow-none ${
                  isActive 
                    ? 'bg-[var(--pig-primary)] border-[#2D1B1B] text-[#2D1B1B]' 
                    : 'bg-white border-[#2D1B1B] text-[#2D1B1B]'
                }`}
              >
                <span className={`text-3xl mb-1 transition-transform group-active:scale-90 ${isActive ? 'emoji-pop' : 'opacity-40 grayscale-[0.5]'}`}>
                  {getMemberEmoji(m.name)}
                </span>
                <span className="font-black text-lg tracking-tight">{m.name}</span>
                {isActive && (
                  <div className="absolute -top-2 -right-1 bg-[#2D1B1B] border-[2px] border-[#2D1B1B] text-[8px] font-black px-2 py-0.5 rounded-full text-white shadow-sm">
                    ACTIVE
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. 風格 */}
      <section className="bg-white border-[3px] border-[#2D1B1B] rounded-[2.5rem] p-6 pig-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--pig-secondary)] text-[var(--pig-primary)] rounded-full flex items-center justify-center border-[2px] border-[#2D1B1B]">
            <Palette size={20} strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-[#2D1B1B]">豬豬變裝</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => updateState({ theme: 'piggy' })} 
            className={`py-6 rounded-2xl border-[3px] font-black text-base transition-all pig-shadow-sm active:translate-y-1 ${state.theme === 'piggy' ? 'bg-[#FFB1B1] border-[#2D1B1B] text-[#2D1B1B]' : 'bg-white border-[#2D1B1B]/10 text-slate-300'}`}
          >
            粉嫩豬豬 🐽
          </button>
          <button 
            onClick={() => updateState({ theme: 'matcha' })} 
            className={`py-6 rounded-2xl border-[3px] font-black text-base transition-all pig-shadow-sm active:translate-y-1 ${state.theme === 'matcha' ? 'bg-[#A2D2A2] border-[#2D1B1B] text-[#2D1B1B]' : 'bg-white border-[#2D1B1B]/10 text-slate-300'}`}
          >
            抹茶小豬 🍵
          </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
