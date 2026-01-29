import { getGeminiModel, cleanJsonResponse, expenseSchema } from "../services/gemini";

const today = new Date().toISOString().split('T')[0];

/**
 * 處理文字輸入記帳
 */
export const processAIInput = async (text: string, categories: string[]) => {
  const model = getGeminiModel();
  const catList = categories.join('、');
  
  const response = await model.generateContent({
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
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
      temperature: 0.1,
    },
  });
  
  return cleanJsonResponse(response.response.text() || '{}');
};

/**
 * 處理收據影像辨識
 */
export const processReceiptImage = async (base64Data: string, mimeType: string, categories: string[]) => {
  const model = getGeminiModel();
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

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [imagePart, textPart] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: expenseSchema,
    },
  });
  
  return cleanJsonResponse(response.response.text() || '{}');
};