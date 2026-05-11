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

    const systemInstruction = `You are a Socratic AI Tutor for students. 
Your goal is to help students learn by asking guiding questions, NOT by giving them the direct answers.
CRITICAL RULE: You must ONLY answer questions related to their studies, their specific assignment, or general academic problem-solving.
If a student asks you something off-topic (e.g., personal advice, coding something unrelated, jokes, general trivia not related to the assignment, or inappropriate topics), you MUST politely refuse to answer and redirect them back to their assignment.
When a student asks a valid question, acknowledge it, give a tiny hint if necessary, but end with a thought-provoking question that leads them to the answer.
Be concise, encouraging, and supportive. Do not write long paragraphs. Keep it conversational.
${assignmentContext}`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Format chat history for Gemini and ensure strict alternating user/model roles
    let formattedHistory = [];
    let expectedRole = 'user';
    
    for (const msg of (chatHistory || [])) {
      const currentRole = msg.role === 'tutor' ? 'model' : 'user';
      if (currentRole === expectedRole) {
        formattedHistory.push({ role: currentRole, parts: [{ text: msg.text }] });
        expectedRole = expectedRole === 'user' ? 'model' : 'user';
      } else if (formattedHistory.length > 0) {
        // Append to the last message if the role is repeated
        formattedHistory[formattedHistory.length - 1].parts[0].text += '\n\n' + msg.text;
      }
    }

    // Gemini history MUST start with 'user'. If it starts with 'model', remove it.
    if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }
    // If the last message in history is user, but we are about to send a new question (which is also user), 
    // it will break the sequence. The question is passed separately to sendMessage. 
    // So history must end with 'model'.
    if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }

    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage([{ text: question }]);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Tutor error:', error);
    res.status(500).json({ message: 'Failed to get a response from the tutor', error: error.message });
  }
};
