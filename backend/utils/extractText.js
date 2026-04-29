const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const extractText = async (fileBuffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      let text = data.text ? data.text.trim() : '';
      // If pdf-parse failed to find text (likely a scanned image PDF), fallback to OCR
      if (text.length < 50) {
        try {
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
      // Direct OCR for images
      return await extractWithGemini(fileBuffer, mimetype);
    } else {
      throw new Error('Unsupported file format. Only PDF, DOCX, and Images are allowed.');
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

module.exports = extractText;
