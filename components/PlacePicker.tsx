
import * as React from 'react';
import * as Lucide from 'lucide-react';
import { searchPlaces } from '../services/aiService';//注意//注意

interface PlacePickerProps {
  onSelect: (place: { title: string; uri: string }) => void;
  onClose: () => void;
  initialQuery?: string;
}

const PlacePicker: React.FC<PlacePickerProps> = ({ onSelect, onClose, initialQuery = '' }) => {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation disabled', err)
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await searchPlaces(query, location?.lat, location?.lng);
      setResults(res);
    } catch (e) {
      alert('地圖搜尋失敗');
    } finally {
      setLoading(true); // 為了讓動畫持續一秒
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#2D1B1B]/70 backdrop-blur-md animate-backdrop">
      <div className="bg-white border-[3px] border-[#2D1B1B] rounded-[2.5rem] w-full max-w-sm p-6 pig-shadow animate-pop-in">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-black text-[#2D1B1B] flex items-center gap-2">
            <Lucide.MapPin className="text-[var(--pig-primary)]" size={24} strokeWidth={4} /> 豬豬找地點
          </h3>
          <button onClick={onClose} className="text-slate-300 hover:text-[#2D1B1B]">
            <Lucide.X size={24} strokeWidth={4} />
          </button>
        </div>

        <div className="relative mb-6">
          <input 
            autoFocus
            className="w-full bg-[var(--pig-secondary)] border-[2.5px] border-[#2D1B1B] rounded-2xl py-3 pl-4 pr-12 font-black text-[#2D1B1B] outline-none placeholder:text-slate-300"
            placeholder="搜尋附近的地點..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-[var(--pig-primary)] rounded-xl border-[2px] border-[#2D1B1B] flex items-center justify-center text-[#2D1B1B] shadow-sm active:translate-y-0.5"
          >
            <Lucide.Search size={18} strokeWidth={3} />
          </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
          {loading ? (
            <div className="py-12 text-center">
              <div className="text-4xl animate-bounce mb-2">🐽</div>
              <p className="text-xs font-black text-slate-400">正在地圖上嗅嗅...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <button 
                key={i}
                onClick={() => onSelect(r)}
                className="w-full text-left bg-white border-[2.5px] border-[#2D1B1B] p-4 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-all hover:bg-[var(--pig-secondary)] shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--pig-primary)] flex items-center justify-center text-[#2D1B1B] shrink-0 border-[1.5px] border-[#2D1B1B]">
                  <Lucide.MapPin size={14} strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-[#2D1B1B] truncate">{r.title}</div>
                  <div className="text-[10px] text-slate-400 font-bold truncate">Google Maps 地點資訊</div>
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 text-center opacity-30">
              <Lucide.SearchX size={40} className="mx-auto mb-2" />
              <p className="text-xs font-black">輸入名稱來搜尋地點</p>
            </div>
          )}
        </div>
        
        <p className="mt-5 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
          Near: {location ? `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}` : 'Searching current location...'}
        </p>
      </div>
    </div>
  );
};

export default PlacePicker;
