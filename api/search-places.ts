import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  const { query, lat, lng } = req.body;

    // 初始化 Gemini
    const genAI = new GoogleGenerativeAI(process.env.API_KEY || process.env.GOOGLE_API_KEY || '');

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", // 或是妳指定的模型
      tools: [{ googleMaps: {} }] 
    });

    const config: any = {};
    if (lat !== undefined && lng !== undefined) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: { latitude: lat, longitude: lng }
        }
      };
    }

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `請搜尋地點資訊： 「${query}」。` }] }],
      ...config
    });

    const response = result.response;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const formattedResults = chunks
      .filter((chunk: any) => chunk.maps)
      .map((chunk: any) => ({
        title: chunk.maps.title,
        uri: chunk.maps.uri
      }));

    res.status(200).json(formattedResults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}