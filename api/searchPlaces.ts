import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextApiRequest, NextApiResponse } from 'next';

// 定義回傳給前端的資料結構
interface SearchResult {
  title: string;
  uri: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // --- 1. CORS 設定 (保持不變) ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { query, lat, lng } = req.body;
    const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error("Server Error: API Key is missing.");
    }

    // --- 2. 初始化 Gemini ---
    const genAI = new GoogleGenerativeAI(apiKey);

    // 使用支援搜尋工具的模型
    // 注意: gemini-2.0-flash-exp 是實驗性模型，若不穩定可改回 gemini-1.5-flash
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools: [{
        // 設定 Google 搜尋工具
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: "MODE_DYNAMIC",
            dynamicThreshold: 0.6, // 設定觸發搜尋的敏感度
          },
        },
      }],
    });

    // --- 3. 建構 Prompt ---
    // 如果有座標，就加入提示詞中，讓搜尋結果優先顯示附近的店
    const locationContext = (lat && lng) 
      ? `(位置座標: ${lat}, ${lng}，請優先搜尋此座標附近的店家)` 
      : '';
      
    const prompt = `請幫我搜尋"${query}"這地點或店家的詳細資訊。
    ${locationContext}
    請提供店名與相關連結(如 Google Maps 連結或官方網站)。`;

    // --- 4. 執行生成 ---
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // --- 5. 解析搜尋結果 (Grounding Metadata) ---
    // 這是 Gemini 搜尋工具回傳資料的標準路徑
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // 提取有效的搜尋結果
    let searchResults: SearchResult[] = chunks
      .filter((c: any) => c.web?.uri && c.web?.title) // 確保有標題和連結
      .map((c: any) => ({
        title: c.web.title,
        uri: c.web.uri
      }));

    // --- 6. 備案處理 (Fallback) ---
    // 如果沒有搜尋到特定的 Grounding Metadata (有時候 AI 會直接用文字回答但沒附連結)
    // 我們手動建立一個 Google Maps 搜尋連結給使用者
    if (searchResults.length === 0) {
      console.log("Gemini 沒回傳 Grounding chunks，使用備案連結");
      searchResults = [
        { 
          title: `搜尋：${query}`, 
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` 
        }
      ];
    }

    // 只回傳前 5 筆結果，避免太多雜訊
    return res.status(200).json(searchResults.slice(0, 5));

  } catch (error: any) {
    console.error("Search API Error:", error);
    return res.status(500).json({ 
      message: error.message || "搜尋發生錯誤",
      // 開發階段可以回傳 error details 方便除錯
      details: error.toString() 
    });
  }
}