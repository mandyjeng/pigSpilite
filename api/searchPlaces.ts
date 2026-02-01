import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  // CORS 設定 (若前後端在同網域通常不需要，但保險起見保留)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  try {
    const { query, lat, lng } = req.body;
    const apiKey = process.env.API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) throw new Error("Server Error: API Key is missing.");

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用支援地圖工具的模型
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp', // 建議使用較新的模型以支援工具
      tools: [{ google_search_retrieval: { dynamic_retrieval_config: { mode: "MODE_DYNAMIC", dynamic_threshold: 0.7 } } }] 
      // 注意: Google Maps Tool 在 Gemini API 的實作方式可能會變動，
      // 若你的環境無法使用 maps tool，建議改用標準 Google Places API 或上面的 Search Grounding
    });

    // 這裡沿用你原本的邏輯，修正為後端執行
    // 注意：目前的 Gemini SDK (Node.js) 對 Maps Tool 的支援可能需要特定的設定
    // 這裡示範標準生成內容，若你需要特定的 Grounding 請參照官方文件
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `請幫我搜尋這家店的詳細資訊： "${query}"。` }] }],
        // 如果你的 SDK 版本支援 tools 設定，請在此加入
    });

    const response = await result.response;
    
    // 假設你要回傳 Grounding Metadata
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const results = chunks
      .filter((c: any) => c.web?.uri || c.maps) // 修正過濾邏輯以適應回傳
      .map((c: any) => ({
        title: c.web?.title || "未知地點",
        uri: c.web?.uri || ""
      }));

    // 若沒有 grounding 結果，回傳模擬資料或錯誤 (視需求調整)
    if (results.length === 0) {
        // 為了讓前端測試，如果 API 沒回傳 grounding，可以回傳一個模擬結果
        // 實際專案建議接 Google Places API
        return res.status(200).json([
            { title: `${query} (搜尋結果)`, uri: `https://www.google.com/maps/search/${query}` }
        ]);
    }
    
    return res.status(200).json(results);

  } catch (error: any) {
    console.error("Search API Error:", error);
    return res.status(500).json({ message: error.message });
  }
}