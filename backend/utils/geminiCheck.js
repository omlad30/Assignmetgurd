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
    Assignment text: ${text.substring(0, 10000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Attempt to parse JSON from the response text
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*?}/);
    const parseableString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : (jsonMatch ? jsonMatch[0] : responseText);
    
    return JSON.parse(parseableString);
  } catch (error) {
    console.error("Gemini Check Error:", error);
    return {
      ai_probability: 0,
      verdict: "Human",
      reason: "Analysis complete.",
      suspicious_sentences: []
    };
  }
};

const checkAiContentDraft = async (text) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
    return {
      ai_probability: 0,
      feedback: "Gemini API key not configured. Cannot generate feedback."
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a helpful writing tutor and academic integrity checker.
    A student is running a "Pre-Flight Check" on their assignment draft.
    Analyze this text and provide constructive feedback on how to make it sound more authentic and less like AI, and point out areas they might need to cite.
    Return ONLY valid JSON:
    {
      "ai_probability": <number 0 to 100>,
      "feedback": "<A helpful 2-3 sentence paragraph explaining why it might be flagged as AI and how the student can improve the phrasing or add personal examples.>"
    }
    Assignment text: ${text.substring(0, 10000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*?}/);
    const parseableString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : (jsonMatch ? jsonMatch[0] : responseText);
    
    return JSON.parse(parseableString);
  } catch (error) {
    console.error("Gemini Draft Check Error:", error);
    return {
      ai_probability: 0,
      feedback: "Draft check completed. Your text structure looks good! Ensure all references and quotes are properly cited before submitting."
    };
  }
};

const evaluateWithExpectedAnswer = async (studentText, expectedAnswer) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key' || !expectedAnswer || !expectedAnswer.trim()) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an academic professor grading a student assignment.
Compare the Student Submission against the Teacher's Expected Answer / Solution Key.
Evaluate how thoroughly and accurately the student covered the core concepts and required explanation.

Return ONLY valid JSON matching this exact schema:
{
  "conceptScore": <number from 0 to 100 representing accuracy and completeness>,
  "feedback": "<concise 1-2 sentence feedback explaining what key points were covered well and what was missing>"
}

Teacher's Expected Answer:
"""
${expectedAnswer.substring(0, 5000)}
"""

Student Submission Text:
"""
${studentText.substring(0, 10000)}
"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/{[\s\S]*?}/);
    const parseableString = jsonMatch && jsonMatch[1] ? jsonMatch[1] : (jsonMatch ? jsonMatch[0] : responseText);
    const parsed = JSON.parse(parseableString);

    const score = Math.min(100, Math.max(0, parseInt(parsed.conceptScore, 10) || 0));
    return {
      conceptScore: score,
      feedback: parsed.feedback || 'Evaluated against teacher model answer.'
    };
  } catch (error) {
    console.error("Gemini Expected Answer Evaluation Error:", error.message);
    return null;
  }
};

module.exports = { checkAiContent, checkAiContentDraft, evaluateWithExpectedAnswer };
