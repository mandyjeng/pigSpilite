// api/analyze.ts
import { GoogleGenAI, Type, SchemaType } from "@google/genai"; // 注意 SDK 引用差異

// 定義 Schema (完全保留你原本的設定)
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

// 清洗 JSON 的輔助函式 (保留原本邏輯)
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

export default async function handler(req: any, res: any) {
  // CORS 設定
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Server Error: API Key is missing.");
    }

    // 初始化 AI Client
    const ai = new GoogleGenAI({ apiKey });
    
    // 從前端接收資料
    const { inputType, text, imageBase64, mimeType, categories } = req.body;
    
    if (!categories || !Array.isArray(categories)) {
      throw new Error("缺少分類清單 (categories)");
    }

    const today = new Date().toISOString().split('T')[0];
    const catList = categories.join('、');
    
    let contents = [];
    
    // 根據 inputType 組裝原本的 Prompt
    if (inputType === 'text') {
      if (!text) throw new Error("缺少文字內容");

      contents = [{
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
      }];

    } else if (inputType === 'image') {
      if (!imageBase64) throw new Error("缺少圖片資料");
      
      const safeMimeType = mimeType || 'image/jpeg';
      
      contents = [{
        role: 'user',
        parts: [
          { inlineData: { data: imageBase64, mimeType: safeMimeType } },
          { 
            text: `請詳細辨識這張收據影像，並回傳 JSON 格式。
今天日期是 ${today}。
可選分類清單：${catList}。

【核心規則】：
1. 提取最終付款總額。
2. merchant: 提取店家名稱。
3. description: 格式為「品項 x數量 $金額」。
4. category: 必須從「${catList}」中選擇。` 
          }
        ]
      }];
    } else {
      throw new Error("不支援的輸入類型");
    }

    // 呼叫 Google GenAI
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // 建議升級到 2.0 flash，速度更快且免費
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema,
        temperature: 0.1,
      },
    });

    // 解析結果
    const parsedData = cleanJsonResponse(response.text || '{}');
    
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error("Backend API Error:", error);
    return res.status(500).json({ 
      message: error.message || '伺服器處理發生錯誤',
      error: error.toString() 
    });
  }
}