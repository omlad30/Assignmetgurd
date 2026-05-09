const { GoogleGenerativeAI } = require('@google/generative-ai');
const Assignment = require('../models/Assignment');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

exports.askTutor = async (req, res) => {
  try {
    const { question, assignmentId, chatHistory } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }

    let assignmentContext = '';
    if (assignmentId) {
      const assignment = await Assignment.findById(assignmentId);
      if (assignment) {
        assignmentContext = `\nContext regarding the assignment they are working on:\nTitle: ${assignment.title}\nDescription: ${assignment.description}`;
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `You are a Socratic AI Tutor for students. 
Your goal is to help students learn by asking guiding questions, NOT by giving them the direct answers.
CRITICAL RULE: You must ONLY answer questions related to their studies, their specific assignment, or general academic problem-solving.
If a student asks you something off-topic (e.g., personal advice, coding something unrelated, jokes, general trivia not related to the assignment, or inappropriate topics), you MUST politely refuse to answer and redirect them back to their assignment.
When a student asks a valid question, acknowledge it, give a tiny hint if necessary, but end with a thought-provoking question that leads them to the answer.
Be concise, encouraging, and supportive. Do not write long paragraphs. Keep it conversational.
${assignmentContext}`;

    // Format chat history for Gemini
    const formattedHistory = (chatHistory || []).map(msg => ({
      role: msg.role === 'tutor' ? 'model' : 'user',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: systemInstruction
    });

    const result = await chat.sendMessage(question);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Tutor error:', error);
    res.status(500).json({ message: 'Failed to get a response from the tutor', error: error.message });
  }
};
