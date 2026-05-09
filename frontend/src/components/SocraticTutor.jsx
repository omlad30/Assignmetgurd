import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import api from '../utils/api';

const SocraticTutor = ({ assignmentId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'tutor', text: 'Hi there! I am your AI Stuck-Helper. What part of the assignment are you struggling with? Remember, I won\'t give you the answers, but I\'ll help you find them yourself!' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = { role: 'user', text: input.trim() };
    const historyToPass = [...messages]; // History before adding the new message
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await api.post('/tutor/ask', {
        question: userMsg.text,
        assignmentId,
        chatHistory: historyToPass
      });

      setMessages(prev => [...prev, { role: 'tutor', text: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'tutor', text: 'Oops! I am having trouble connecting to my brain right now. Please try again later.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-primary-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-primary-500/50 hover:scale-105 transition-all duration-300 z-50 flex items-center justify-center animate-bounce group"
      >
        <MessageCircle className="h-6 w-6 group-hover:hidden" />
        <Bot className="h-6 w-6 hidden group-hover:block" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden transition-colors duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          <h3 className="font-bold">AI Stuck-Helper</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto max-h-96 min-h-[300px] bg-gray-50 dark:bg-gray-950 flex flex-col gap-3">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
            <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-primary-100 text-primary-700' : 'bg-indigo-100 text-indigo-700'}`}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 max-w-[85%] mr-auto">
             <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
               <Bot className="h-4 w-4" />
             </div>
             <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-tl-none flex items-center gap-1">
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
               <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for a hint..."
            className="w-full bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500 rounded-full pl-4 pr-12 py-2.5 text-sm dark:text-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SocraticTutor;
