
export type Category = string;

export interface Member {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: '支出' | '收入' | '公帳' | '私帳';
  category: Category;
  amount: number;
  item: string;
  merchant: string;
  mapUrl?: string; // 新增：地圖連結
  payerId: string;
  isSplit: boolean;
  splitType: 'equal' | 'custom';
  splitWith: string[];
  splitDetails?: Record<string, number>;
  rowIndex?: number;
}

export interface AppState {
  members: Member[];
  categories: string[];
  transactions: Transaction[];
  currentUser: string;
  theme: 'piggy' | 'matcha';
  sheetUrl: string;
}
