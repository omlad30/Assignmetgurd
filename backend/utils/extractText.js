const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Tesseract = require('tesseract.js');

const extractWithGemini = async (fileBuffer, mimetype) => {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key') {
    throw new Error('Gemini API key missing. Cannot perform OCR on images/scanned PDFs.');
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = "You are an OCR tool. Extract and return all the text from this document/image exactly as written. Do not add any conversational text or markdown. If there is no readable text, return the exact string 'NO_TEXT_FOUND'.";
  const parts = [
    { inlineData: { data: fileBuffer.toString("base64"), mimeType: mimetype } }
  ];
  const result = await model.generateContent([prompt, ...parts]);
  const text = result.response.text().trim();
  return text === 'NO_TEXT_FOUND' ? '' : text;
};

const extractWithTesseract = async (fileBuffer) => {
  try {
    const result = await Tesseract.recognize(fileBuffer, 'eng');
    return result.data.text.trim();
  } catch (error) {
    console.error("Tesseract OCR failed:", error);
    return '';
  }
};

const sanitizeText = (text) => {
  if (!text) return text;
  
  // 1. Remove zero-width characters (Token Breaking bypass)
  let sanitized = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
  
  // 2. Map common Cyrillic homoglyphs back to standard Latin (The Cyrillic Trick bypass)
  const homoglyphs = {
    '\u0430': 'a', '\u0441': 'c', '\u0435': 'e', '\u043E': 'o', '\u0440': 'p', '\u0445': 'x', '\u0443': 'y',
    '\u0410': 'A', '\u0421': 'C', '\u0415': 'E', '\u041E': 'O', '\u0420': 'P', '\u0425': 'X', '\u0423': 'Y'
  };
  
  sanitized = sanitized.replace(/[\u0430\u0441\u0435\u043E\u0440\u0445\u0443\u0410\u0421\u0415\u041E\u0420\u0425\u0423]/g, match => homoglyphs[match] || match);
  
  return sanitized.trim();
};

const extractTextRaw = async (fileBuffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      let text = data.text ? data.text.trim() : '';
      // If pdf-parse failed to find text (likely a scanned image PDF), fallback to OCR
      if (text.length < 50) {
        try {
          // Gemini works better for PDFs containing images
          const ocrText = await extractWithGemini(fileBuffer, mimetype);
          if (ocrText.length > text.length) text = ocrText;
        } catch (ocrErr) {
          console.error("OCR Fallback failed:", ocrErr);
        }
      }
      return text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else if (mimetype.startsWith('image/')) {
      // Use Tesseract for direct images first to save Gemini Credits
      let text = await extractWithTesseract(fileBuffer);
      if (text.length < 20) {
        // Fallback to Gemini if Tesseract fails to read handwriting
        text = await extractWithGemini(fileBuffer, mimetype);
      }
      return text;
    } else {
      throw new Error('Unsupported file format. Only PDF, DOCX, and Images are allowed.');
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

const extractText = async (fileBuffer, mimetype) => {
  const rawText = await extractTextRaw(fileBuffer, mimetype);
  return sanitizeText(rawText);
};

module.exports = extractText;
