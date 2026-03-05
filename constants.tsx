
import * as React from 'react';
import * as Lucide from 'lucide-react';

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '餐飲': <Lucide.Utensils size={18} />,
  '豬糧': <Lucide.Utensils size={18} />, 
  '薪資': <Lucide.Wallet size={18} />,
  '娛樂': <Lucide.Gamepad2 size={18} />,
  '購物': <Lucide.ShoppingBag size={18} />,
  '交通': <Lucide.Car size={18} />,
  '居家': <Lucide.Home size={18} />,
  '豬窩': <Lucide.Home size={18} />,   
  '個人': <Lucide.Heart size={18} />,
  '醫藥': <Lucide.PlusCircle size={18} />,
  '其他': <Lucide.MoreHorizontal size={18} />,
};

export const CATEGORY_COLORS: Record<string, string> = {
  '餐飲': 'bg-red-100 text-red-600',
  '豬糧': 'bg-red-100 text-red-600',
  '薪資': 'bg-green-100 text-green-600',
  '娛樂': 'bg-purple-100 text-purple-600',
  '購物': 'bg-pink-100 text-pink-600',
  '交通': 'bg-blue-100 text-blue-600',
  '居家': 'bg-amber-100 text-amber-600',
  '豬窩': 'bg-amber-100 text-amber-600',
  '個人': 'bg-indigo-100 text-indigo-600',
  '醫藥': 'bg-teal-100 text-teal-600',
  '其他': 'bg-slate-100 text-slate-600',
};

// 這裡就是你要改的地方！修改這裡的 Emoji，全站都會跟著變
export const getMemberEmoji = (name: string = '') => {
  if (name.includes('Mandy')) return '❤️'; // 你可以改成 🐱, 🎀, 或任何你喜歡的
  if (name.includes('小豬')) return '🐽';
  return '👤';
};

export const getCategoryIcon = (category: string, size: number = 20) => {
  const cleanCat = (category || '').toString().trim();
  const icon = CATEGORY_ICONS[cleanCat] || CATEGORY_ICONS['其他'];
  
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<any>, { size });
  }
  return icon;
};

export const getCategoryColorClass = (category: string) => {
  const cleanCat = (category || '').toString().trim();
  return CATEGORY_COLORS[cleanCat] || CATEGORY_COLORS['其他'];
};

export const TABS = [
  { id: 'overview', label: '記帳', icon: <Lucide.LayoutDashboard size={20} /> },
  { id: 'details', label: '明細', icon: <Lucide.ListOrdered size={20} /> },
  { id: 'settings', label: '設定', icon: <Lucide.Settings size={20} /> },
];
