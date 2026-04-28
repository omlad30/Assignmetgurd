const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const extractText = async (fileBuffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(fileBuffer);
      return data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      mimetype === 'application/msword'
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value;
    } else {
      throw new Error('Unsupported file format. Only PDF and DOCX are allowed.');
    }
  } catch (error) {
    throw new Error(`Text extraction failed: ${error.message}`);
  }
};

module.exports = extractText;
