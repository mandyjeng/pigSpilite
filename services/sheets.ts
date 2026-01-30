
import { Transaction, Category } from '../types';

const toLocalDateString = (dateInput: any): string => {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return String(dateInput);
  }
};

export const fetchCategoriesFromSheet = async (url: string): Promise<string[]> => {
  if (!url) return [];
  try {
    const response = await fetch(`${url}?action=GET_CATEGORIES`, { method: 'GET', cache: 'no-store' });
    const text = await response.text();
    
    if (!text.trim().startsWith('[') && !text.trim().startsWith('{')) {
      console.warn('分類讀取失敗，GAS 回傳了非 JSON 內容。這通常是因為腳本權限或未部署成功。回傳內容：', text);
      throw new Error('GAS_NOT_JSON');
    }

    const data = JSON.parse(text);
    if (!Array.isArray(data)) return [];

    return data
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') {
          return item.分類 || item.名稱 || item.name || '';
        }
        return String(item);
      })
      .filter(c => c && typeof c === 'string' && c.trim() !== '');
  } catch (error) {
    console.error('Fetch categories failed, using defaults:', error);
    return ['餐飲', '豬糧', '薪資', '娛樂', '購物', '交通', '豬窩', '其他'];
  }
};

export const fetchTransactionsFromSheet = async (url: string): Promise<Transaction[]> => {
  if (!url) return [];
  try {
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
    const text = await response.text();

    if (!text.trim().startsWith('[') && !text.trim().startsWith('{')) {
      console.error('資料載入失敗！GAS 回傳了非 JSON 格式字串。請確認 GAS 部署為「網頁應用程式」且「任何人」可存取。內容：', text);
      return [];
    }

    const data = JSON.parse(text);
    const records = Array.isArray(data) ? data : (data.transactions || []);
    
    return records
      .filter((row: any) => row['日期'] || row['ID'])
      .map((row: any) => {
        let rawPayer = row['付錢的人'] || '小豬';
        const p = String(rawPayer).trim().toLowerCase();
        if (p === 'piggy' || p === '小豬') rawPayer = '小豬';
        else if (p === 'mandy') rawPayer = 'Mandy';

        const splitStr = row['分帳'] ? row['分帳'].toString() : '';
        const splitWith: string[] = [];
        const splitDetails: Record<string, number> = {};
        let hasCustomAmounts = false;

        if (splitStr) {
          splitStr.split(',').forEach((s: string) => {
            const parts = s.trim().split(':');
            let name = parts[0].trim();
            const amount = parts[1] ? Number(parts[1]) : null;

            const t = name.toLowerCase();
            if (t === 'piggy' || t === '小豬') name = '小豬';
            else if (t === 'mandy') name = 'Mandy';

            if (name) {
              splitWith.push(name);
              if (amount !== null && !isNaN(amount)) {
                splitDetails[name] = amount;
                hasCustomAmounts = true;
              }
            }
          });
        }

        if (splitWith.length === 0) splitWith.push(rawPayer);

        return {
          id: String(row['ID'] || `row-${row.rowIndex}`),
          rowIndex: row.rowIndex,
          date: toLocalDateString(row['日期']),
          type: (row['類型'] || '支出') as any,
          category: (row['類別'] || '其他') as Category,
          amount: parseFloat(row['金額']) || 0,
          merchant: String(row['店家名稱'] || ''), 
          mapUrl: String(row['地圖連結'] || ''),
          item: String(row['描述'] || ''),
          payerId: rawPayer,
          isSplit: splitWith.length > 1,
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
    'ID': t.id,
    '地圖連結': t.mapUrl || ''
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
    'ID': t.id,
    '地圖連結': t.mapUrl || ''
  };
  await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
};

export const deleteTransactionFromSheet = async (url: string, rowIndex: number) => {
  if (!url) return;
  await fetch(url, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'DELETE_TRANSACTION', rowIndex }) });
};
