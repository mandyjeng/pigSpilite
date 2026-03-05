// api/analyze.ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 初始化 Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY || process.env.GOOGLE_API_KEY || '');

// 定義 Schema (使用舊版 SchemaType)
const expenseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    merchant: { type: SchemaType.STRING, description: '店家或平台名稱。' },
    description: { type: SchemaType.STRING, description: '具體的購買品項清單與金額，多項請換行。' },
    amount: { type: SchemaType.NUMBER, description: '最終加總後的總金額。' },
    category: { type: SchemaType.STRING, description: '分類：根據提供的分類清單選擇最合適的一個。' },
    type: { type: SchemaType.STRING, description: '類型：支出、收入' },
    date: { type: SchemaType.STRING, description: '日期，格式 YYYY-MM-DD。' },
  },
  required: ['merchant', 'description', 'amount', 'category', 'type', 'date'],
};

// 輔助函式：清理 JSON
const cleanJsonResponse = (text: string) => {
  if (!text) return {};
  try {
    let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch (innerE) {}
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) throw new Error("Server Error: API Key is missing.");

    const { inputType, text, imageBase64, mimeType, categories } = req.body;
    
    // 取得模型 (使用舊版 SDK 的寫法)
    const model = genAI.getGenerativeModel({
      
      model: "gemini-flash-latest",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: expenseSchema,
        temperature: 0.1,
      },
    });

    const today = new Date().toISOString().split('T')[0];
    const catList = categories ? categories.join('、') : '';
    let result;

    if (inputType === 'text') {
      const prompt = `這是一筆文字記帳資訊： "${text}"。
今天日期是 ${today}。
可選分類有：${catList}。
請依照 JSON Schema 規則處理。`;
      
      result = await model.generateContent(prompt);

    } else if (inputType === 'image') {
      const safeMimeType = mimeType || 'image/jpeg';
      // 舊版 SDK 處理圖片的方式
      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: safeMimeType
        }
      };
      const prompt = `請詳細辨識這張收據影像。
今天日期是 ${today}。
可選分類清單：${catList}。
請依照 JSON Schema 規則回傳。`;
      
      result = await model.generateContent([prompt, imagePart]);
    } else {
      throw new Error("不支援的輸入類型");
    }

    const responseText = result.response.text();
    const parsedData = cleanJsonResponse(responseText);
    
    return res.status(200).json(parsedData);

  } catch (error: any) {
    console.error("Backend API Error:", error);
    return res.status(500).json({ 
      message: error.message || '伺服器處理發生錯誤',
      error: error.toString() 
    });
  }
}