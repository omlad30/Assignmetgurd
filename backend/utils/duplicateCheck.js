const natural = require('natural');
const TfIdf = natural.TfIdf;

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

const checkDuplicate = (newText, previousSubmissions) => {
  if (!previousSubmissions || previousSubmissions.length === 0) {
    return { isDuplicate: false, similarityScore: 0, matchedWith: null };
  }

  const tfidf = new TfIdf();
  tfidf.addDocument(newText); // Document 0
  
  previousSubmissions.forEach(sub => {
    tfidf.addDocument(sub.extractedText || ''); // Document 1, 2, ...
  });

  const numDocs = previousSubmissions.length + 1;
  const terms = new Set();
  
  // collect all terms
  for(let i=0; i<numDocs; i++) {
    const termStats = tfidf.listTerms(i);
    termStats.forEach(item => terms.add(item.term));
  }
  
  const termArray = Array.from(terms);
  
  // build vectors
  const vectors = [];
  for(let i=0; i<numDocs; i++) {
    vectors[i] = termArray.map(term => tfidf.tfidf(term, i));
  }

  let highestSimilarity = 0;
  let matchedSubmissionId = null;
  let matchedStudentId = null;

  for (let i = 1; i < numDocs; i++) {
    const similarity = cosineSimilarity(vectors[0], vectors[i]) * 100; // to percentage
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity;
      matchedSubmissionId = previousSubmissions[i-1]._id;
      matchedStudentId = previousSubmissions[i-1].studentId;
    }
  }

  return {
    isDuplicate: highestSimilarity >= 70,
    similarityScore: Math.round(highestSimilarity),
    matchedWith: matchedStudentId
  };
};

module.exports = { checkDuplicate };
