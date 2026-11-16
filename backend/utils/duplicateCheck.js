const natural = require('natural');
const TfIdf = natural.TfIdf;
const { isCodeContent, normalizeCode } = require('./codeTokenizer');

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Unicode-aware word extractor for multilingual text (Hindi, Marathi, regional scripts)
function prepareTextForVectorization(text, isCode) {
  if (!text) return '';
  if (isCode) {
    return normalizeCode(text);
  }

  // If text contains Devanagari or other Indic Unicode characters, normalize spacing
  if (/[\u0900-\u0D7F]/.test(text)) {
    // Preserve Unicode letters and numbers, normalizing punctuation
    return text.replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  return text;
}

const checkDuplicate = (newText, previousSubmissions) => {
  if (!previousSubmissions || previousSubmissions.length === 0) {
    return { isDuplicate: false, similarityScore: 0, matchedWith: null, isCode: false };
  }

  const isCode = isCodeContent(newText);
  const targetText = prepareTextForVectorization(newText, isCode);

  const tfidf = new TfIdf();
  tfidf.addDocument(targetText); // Document 0

  previousSubmissions.forEach(sub => {
    const rawText = sub.extractedText || '';
    const docText = prepareTextForVectorization(rawText, isCode);
    tfidf.addDocument(docText); // Document 1, 2, ...
  });

  const numDocs = previousSubmissions.length + 1;
  const terms = new Set();

  // collect all terms
  for (let i = 0; i < numDocs; i++) {
    const termStats = tfidf.listTerms(i);
    termStats.forEach(item => terms.add(item.term));
  }

  const termArray = Array.from(terms);

  // build vectors
  const vectors = [];
  for (let i = 0; i < numDocs; i++) {
    vectors[i] = termArray.map(term => tfidf.tfidf(term, i));
  }

  let highestSimilarity = 0;
  let matchedSubmissionId = null;
  let matchedStudentId = null;

  for (let i = 1; i < numDocs; i++) {
    const similarity = cosineSimilarity(vectors[0], vectors[i]) * 100; // to percentage
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      matchedSubmissionId = previousSubmissions[i - 1]._id;
      matchedStudentId = previousSubmissions[i - 1].studentId;
    }
  }

  return {
    isDuplicate: highestSimilarity >= 65,
    similarityScore: Math.round(highestSimilarity),
    matchedWith: matchedStudentId,
    isCode
  };
};

module.exports = { checkDuplicate };
