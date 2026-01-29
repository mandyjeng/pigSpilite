
import { Transaction, Category } from '../types';

const toLocalDateString = (dateInput: any): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fetchCategoriesFromSheet = async (url: string): Promise<string[]> => {
  if (!url) return [];
  try {
    const response = await fetch(`${url}?action=GET_CATEGORIES`, { method: 'GET', cache: 'no-store' });
    const data = await response.json();
    
    // 防禦性檢查：確保 data 是陣列
    if (!Array.isArray(data)) return [];

    // 關鍵修正：確保陣列內只有字串。如果抓到的是物件（例如誤抓到交易紀錄），嘗試提取名稱或過濾掉。
    return data
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          // 如果後端回傳的是物件格式，嘗試找尋可能的名稱欄位
          return item.分類 || item.名稱 || item.name || item.label || '';
        }
        return String(item);
      })
      .filter(c => c && typeof c === 'string' && c.trim() !== '' && !c.includes('{')); // 過濾掉空字串或殘留的 JSON 字串
  } catch (error) {
    console.error('Fetch categories failed:', error);
    return ['餐飲', '購物', '娛樂', '交通', '其他']; // 失敗時回傳預設值
  }
};

export const fetchTransactionsFromSheet = async (url: string): Promise<Transaction[]> => {
  if (!url) return [];
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    const data = await response.json();
    const records = Array.isArray(data) ? data : (data.transactions || []);
    
    return records.map((row: any) => {
      let rawPayer = row['付錢的人'] || '小豬';
      const p = String(rawPayer).toLowerCase();
      if (p === 'piggy' || p === '小豬') rawPayer = '小豬';
      else if (p === 'mandy') rawPayer = 'Mandy';

      const splitStr = row['分帳'] ? row['分帳'].toString() : '';
      const splitWith: string[] = [];
      const splitDetails: Record<string, number> = {};
      let hasCustomAmounts = false;

      if (splitStr) {
        splitStr.split(',').forEach((s: string) => {
          const parts = s.trim().split(':');
          let name = parts[0];
          const amount = parts[1] ? Number(parts[1]) : null;

          const t = name.toLowerCase();
          if (t === 'piggy' || t === '小豬') name = '小豬';
          else if (t === 'mandy') name = 'Mandy';

          splitWith.push(name);
          if (amount !== null) {
            splitDetails[name] = amount;
            hasCustomAmounts = true;
          }
        });
      }

      return {
        id: row['ID'] || row['id'] || `row-${row.rowIndex}`,
        rowIndex: row.rowIndex,
        date: toLocalDateString(row['日期']),
        type: (row['類型'] || '支出') as any,
        category: (row['類別'] || '其他') as Category,
        amount: Number(row['金額']) || 0,
        merchant: row['店家名稱'] || '', 
        item: row['描述'] || '',
        payerId: rawPayer,
        isSplit: splitWith.length > 0,
        splitType: hasCustomAmounts ? 'custom' : 'equal',
        splitWith: splitWith,
        splitDetails: splitDetails,
      };
    });
  } catch (error) {
    console.error('Fetch transactions failed:', error);
    return [];
  }
};

const serializeSplit = (t: Transaction) => {
  if (!t.isSplit) return '';
  if (t.splitType === 'equal') return t.splitWith.join(', ');
  return t.splitWith.map(name => `${name}:${t.splitDetails?.[name] || 0}`).join(', ');
};

export const saveToGoogleSheet = async (url: string, t: Transaction) => {
  if (!url) return;
  const payload = {
    action: 'ADD_TRANSACTION',
    '日期': t.date,
    '類型': t.type,
    '類別': t.category,
    '金額': t.amount,
    '店家名稱': t.merchant,
    '描述': t.item,
    '付錢的人': t.payerId,
    '分帳': serializeSplit(t),
    'ID': t.id
  };
  await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
};

export const updateTransactionInSheet = async (url: string, t: Transaction) => {
  if (!url || !t.rowIndex) return;
  const payload = {
    action: 'UPDATE_TRANSACTION',
    rowIndex: t.rowIndex,
    '日期': t.date,
    '類型': t.type,
    '類別': t.category,
    '金額': t.amount,
    '店家名稱': t.merchant,
    '描述': t.item,
    '付錢的人': t.payerId,
    '分帳': serializeSplit(t),
    'ID': t.id
  };
  await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
};

export const deleteTransactionFromSheet = async (url: string, rowIndex: number) => {
  if (!url) return;
  await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'DELETE_TRANSACTION', rowIndex }) });
};
