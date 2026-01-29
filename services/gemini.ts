
import { GoogleGenAI, Type } from "@google/genai";

const expenseSchema = {
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

const cleanJsonResponse = (text: string) => {
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

export const processAIInput = async (text: string, categories: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const catList = categories.join('、');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      role: 'user',
      parts: [{
        text: `這是一筆文字記帳資訊： "${text}"。
今天日期是 ${today}。
可選分類有：${catList}。

請依照以下嚴格規則處理並回傳 JSON：
1. 店家 (merchant)：提取最像店家的名稱。
2. 項目內容 (description)：列出品項與金額。
3. 金額 (amount)：加總。
4. 類型 (type)：支出或收入。
5. 分類 (category)：必須從「${catList}」中挑選一個最合適的。`
      }]
    }],
    config: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
      temperature: 0.1,
    },
  });
  
  return cleanJsonResponse(response.text || '{}');
};

export const processReceiptImage = async (base64Data: string, mimeType: string, categories: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];
  const catList = categories.join('、');

  const imagePart = {
    inlineData: { data: base64Data, mimeType: mimeType },
  };
  
  const textPart = {
    text: `請詳細辨識這張收據影像，並回傳 JSON 格式。
今天日期是 ${today}。
可選分類清單：${catList}。

【核心規則】：
1. 提取最終付款總額。
2. merchant: 提取店家名稱。
3. description: 格式為「品項 x數量 $金額」。
4. category: 必須從「${catList}」中選擇。`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [imagePart, textPart] },
    config: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
    },
  });
  
  return cleanJsonResponse(response.text || '{}');
};
