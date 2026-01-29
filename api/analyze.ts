import { getGeminiModel, cleanJsonResponse, expenseSchema } from "../services/gemini";

const today = new Date().toISOString().split('T')[0];

/**
 * 文字記帳辨識
 */
export const processAIInput = async (text: string, categories: string[]) => {
  const model = getGeminiModel();
  const catList = categories.join('、');
  
  const prompt = `這是一筆文字記帳資訊： "${text}"。
今天日期是 ${today}。
可選分類有：${catList}。

請依照以下嚴格規則處理並回傳 JSON：
1. 店家 (merchant)：提取最像店家的名稱。
2. 項目內容 (description)：列出品項與金額。
3. 金額 (amount)：加總。
4. 類型 (type)：支出或收入。
5. 分類 (category)：必須從「${catList}」中挑選一個最合適的一個。`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
      temperature: 0.1,
    },
  });
  
  return cleanJsonResponse(result.response.text());
};

/**
 * 圖片收據辨識
 */
export const processReceiptImage = async (base64Data: string, mimeType: string, categories: string[]) => {
  const model = getGeminiModel();
  const catList = categories.join('、');

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { data: base64Data, mimeType: mimeType } },
        { text: `請辨識收據內容。今天日期：${today}。可選分類：${catList}。請提取總金額、店家名稱及明細。` }
      ]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
    },
  });
  
  return cleanJsonResponse(result.response.text());
};