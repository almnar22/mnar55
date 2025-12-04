import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const askLibrarian = async (query: string, context?: string): Promise<string> => {
  if (!apiKey) {
    return "عذراً، مفتاح API غير متوفر. يرجى إعداده لتشغيل المساعد الذكي.";
  }

  try {
    const model = 'gemini-2.5-flash';
    const systemInstruction = `
      أنت مساعد مكتبة جامعية ذكي ومفيد. تتحدث اللغة العربية بطلاقة ورسمية.
      مهمتك هي مساعدة الطلاب والباحثين في العثور على الكتب، اقتراح مراجع، وتلخيص المواضيع.
      
      إذا تم تزويدك بسياق (مثل قائمة كتب)، استخدمه للإجابة.
      كن موجزاً، دقيقاً، واستخدم تنسيق Markdown عند الحاجة.
    `;

    const fullPrompt = context 
      ? `السياق الحالي (الكتب المتاحة في البحث):\n${context}\n\nسؤال المستخدم: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    return response.text || "لم أتمكن من الحصول على إجابة، يرجى المحاولة مرة أخرى.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي.";
  }
};