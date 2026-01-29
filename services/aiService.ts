// src/services/aiService.ts

// 1. 定義回傳資料介面 (依照原本的 Schema)
export interface ExpenseData {
  merchant: string;
  description: string;
  amount: number;
  category: string;
  type: string; // '支出' | '收入'
  date: string; // YYYY-MM-DD
}

// 2. 定義請求 Payload 的介面
interface AnalyzeRequest {
  inputType: 'text' | 'image';
  text?: string;
  imageBase64?: string;
  mimeType?: string;
  categories: string[]; // 必須傳入分類清單給後端 Prompt 使用
}

// 3. 共用的請求發送器
const sendRequest = async (payload: AnalyzeRequest): Promise<ExpenseData> => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.message || `請求失敗 (${response.status})`;
    throw new Error(errorMessage);
  }

  return data as ExpenseData;
};

// 4. 處理文字輸入
export const processAIInput = async (text: string, categories: string[]) => {
  try {
    return await sendRequest({
      inputType: 'text',
      text,
      categories,
    });
  } catch (error) {
    console.error("Text analysis failed:", error);
    throw error;
  }
};

// 5. 處理圖片輸入
export const processReceiptImage = async (base64Data: string, mimeType: string, categories: string[]) => {
  try {
    // 確保 Base64 字串乾淨 (移除 data:image/xxx;base64, 前綴)
    const cleanBase64 = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;

    return await sendRequest({
      inputType: 'image',
      imageBase64: cleanBase64,
      mimeType: mimeType, // 傳遞原始 MimeType 給後端
      categories,
    });
  } catch (error) {
    console.error("Image analysis failed:", error);
    throw error;
  }
};