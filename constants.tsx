
import React from 'react';
import { 
  Utensils, 
  Wallet, 
  Gamepad2, 
  ShoppingBag, 
  MoreHorizontal,
  LayoutDashboard,
  ListOrdered,
  Settings as SettingsIcon,
  Car,
  Home,
  Heart
} from 'lucide-react';
import { Category } from './types';

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  '餐飲': <Utensils size={18} />,
  '薪資': <Wallet size={18} />,
  '娛樂': <Gamepad2 size={18} />,
  '購物': <ShoppingBag size={18} />,
  '交通': <Car size={18} />,
  '居家': <Home size={18} />,
  '個人': <Heart size={18} />,
  '其他': <MoreHorizontal size={18} />,
};

export const CATEGORY_COLORS: Record<string, string> = {
  '餐飲': 'bg-red-100 text-red-600',
  '薪資': 'bg-green-100 text-green-600',
  '娛樂': 'bg-purple-100 text-purple-600',
  '購物': 'bg-pink-100 text-pink-600',
  '交通': 'bg-blue-100 text-blue-600',
  '居家': 'bg-amber-100 text-amber-600',
  '個人': 'bg-indigo-100 text-indigo-600',
  '其他': 'bg-slate-100 text-slate-600',
};

export const getCategoryIcon = (category: string, size: number = 20) => {
  const icon = CATEGORY_ICONS[category] || CATEGORY_ICONS['其他'];
  if (React.isValidElement(icon)) {
    return React.cloneElement(icon as React.ReactElement<any>, { size });
  }
  return icon;
};

export const getCategoryColorClass = (category: string) => {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS['其他'];
};

export const TABS = [
  { id: 'overview', label: '記帳', icon: <LayoutDashboard size={20} /> },
  { id: 'details', label: '明細', icon: <ListOrdered size={20} /> },
  { id: 'settings', label: '設定', icon: <SettingsIcon size={20} /> },
];
