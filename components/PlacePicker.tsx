import * as React from 'react';
import * as Lucide from 'lucide-react';
// 刪除下面這一行，因為不能直接匯入後端邏輯
// import { searchPlaces } from '../services/aiService'; 

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
      // 修改這裡：改用 fetch 呼叫 API
      const response = await fetch('/api/searchPlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            query, 
            lat: location?.lat, 
            lng: location?.lng 
        }),
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setResults(data);
    } catch (e) {
      console.error(e);
      alert('地圖搜尋失敗');
    } finally {
      // 維持你的動畫邏輯
      setTimeout(() => setLoading(false), 800);
    }
  };

  return (
    // ... 下面的 JSX 保持不變 ...
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#2D1B1B]/70 backdrop-blur-md animate-backdrop">
      {/* ... 省略中間內容 ... */}
    </div>
  );
};

export default PlacePicker;