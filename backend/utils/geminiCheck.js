const { GoogleGenerativeAI } = require('@google/generative-ai');

const checkAiContent = async (text) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
    // If not configured, return safe defaults to not block testing
    return {
      ai_probability: 0,
      verdict: "Human",
      reason: "Gemini API key not configured.",
      suspicious_sentences: []
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an academic integrity checker.
    Analyze this assignment and return ONLY valid JSON:
    {
      "ai_probability": <number 0 to 100>,
      "verdict": "<Human | AI | Mixed>",
      "reason": "<one line explanation>",
      "suspicious_sentences": ["<sentence 1>", "<sentence 2>"]
    }
    Assignment text: ${text.substring(0, 10000)} // Limiting size to avoid token issues`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON from the response text
    // Sometimes LLMs wrap json in markdown
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*?}/);
    const parseableString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : (jsonMatch ? jsonMatch[0] : responseText);
    
    return JSON.parse(parseableString);
  } catch (error) {
    console.error("Gemini Check Error:", error);
    return {
      ai_probability: 0,
      verdict: "Human",
      reason: "Failed to connect to AI service.",
      suspicious_sentences: []
    };
  }
};

module.exports = { checkAiContent };
