import { GoogleGenAI, Type } from "@google/genai";


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
  // 修正 1: 根據你的截圖，Vite 環境變數名稱應為 GOOGLE_API_KEY
  const apiKey = import.meta.env.GOOGLE_API_KEY; 
  
  if (!apiKey) {
    throw new Error("找不到 API Key，請檢查環境變數設定。");
  }

  // 修正 2: 使用 GoogleGenAI 而非 GoogleGenerativeAI
  const ai = new GoogleGenAI(apiKey); 
  
  // 修正 3: 直接取得模型實例，目前的 SDK 寫法通常如下
  return ai.getGenerativeModel({ model: "gemini-1.5-flash" }); 
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