
import * as React from 'react';
import * as Lucide from 'lucide-react';
import { getCategoryIcon, getCategoryColorClass } from '@/constants';

interface CategoryPickerProps {
  value: string;
  categories: string[];
  onChange: (category: string) => void;
  label?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, categories, onChange, label = "分類" }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[8px] font-black text-slate-400 uppercase mb-0.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 bg-transparent font-bold text-[13px] outline-none text-[#2D1B1B] text-left"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-[1px] border-[#2D1B1B]/10 ${getCategoryColorClass(value)}`}>
          {getCategoryIcon(value, 12)}
        </div>
        <span className="truncate">{value || '選擇分類'}</span>
        <Lucide.ChevronDown size={14} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white border-[3px] border-[#2D1B1B] rounded-2xl pig-shadow-sm z-[150] max-h-[200px] overflow-y-auto no-scrollbar p-1 animate-pop-in">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                onChange(cat);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all hover:bg-[var(--pig-secondary)] ${value === cat ? 'bg-[var(--pig-secondary)]' : ''}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-[1px] border-[#2D1B1B]/10 ${getCategoryColorClass(cat)}`}>
                {getCategoryIcon(cat, 14)}
              </div>
              <span className={`text-[13px] font-black ${value === cat ? 'text-[#2D1B1B]' : 'text-slate-500'}`}>{cat}</span>
              {value === cat && <Lucide.Check size={14} className="ml-auto text-[var(--pig-primary)]" strokeWidth={4} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
