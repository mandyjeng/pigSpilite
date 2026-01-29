import { GoogleGenerativeAI, Type } from "@google/genai";

// 定義回傳的 JSON 結構
export const expenseSchema = {
  type: Type.OBJECT,
  properties: {
    merchant: { type: Type.STRING, description: '店家或平台名稱。' },
    description: { type: Type.STRING, description: '具體的購買品項清單與金額，多項請換行。' },
    amount: { type: Type.NUMBER, description: '最終加總後的總金額。' },
    category: { type: Type.STRING, description: '分類：根據提供的分類清單選擇最合適的一個。' },
    type: { type: Type.STRING, description: '類型：支出、收入' },
    date: { type: Type.STRING, description: '日期，格式 YYYY-MM-DD。' },
  },
  required: ['merchant', 'description', 'amount', 'category', 'type', 'date'],
};

// 初始化 AI 實例
export const getGeminiModel = () => {
  // 注意：在 Vite 中環境變數通常是 import.meta.env.VITE_API_KEY
  // const apiKey = import.meta.env.GOOGLE_API_KEY;  
  // const ai = new GoogleGenAI({ apiKey });
  const ai = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

  return ai.models.get('gemini-flash-latest'); // 建議使用穩定版名稱
};

// 清理與轉換 JSON 字串
export const cleanJsonResponse = (text: string) => {
  if (!text) return {};
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerE) {}
    }
    throw new Error("AI 回傳格式不正確");
  }
};