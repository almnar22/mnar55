import React, { useState, useRef, useEffect } from 'react';
import { askLibrarian } from '../services/geminiService';
import { Book } from '../types';
import { Send, Sparkles, User, Bot, Loader } from 'lucide-react';

interface AssistantProps {
  books: Book[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const Assistant: React.FC<AssistantProps> = ({ books }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'أهلاً بك! أنا المساعد الذكي لمكتبة الجامعة. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن الكتب، اقتراحات القراءة، أو معلومات عن المصادر المتاحة.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    // Create context from books catalog
    const context = books.map(b => `- (${b.code}) ${b.title} للمؤلف ${b.author} [${b.specialization}] - متاح: ${b.remainingCopies}`).join('\n');
    
    const response = await askLibrarian(userMsg, context);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-gradient-to-l from-primary-600 to-primary-800 text-white flex items-center gap-3">
        <div className="bg-white/10 p-2 rounded-lg">
            <Sparkles className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
            <h2 className="font-bold text-lg">أمين المكتبة الذكي</h2>
            <p className="text-primary-100 text-xs">مدعوم بواسطة Google Gemini</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-primary-100'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-slate-600" /> : <Bot className="w-5 h-5 text-primary-600" />}
            </div>
            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                ? 'bg-slate-800 text-white rounded-tr-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
            }`}>
                {msg.content.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0">{line}</p>
                ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-xs text-slate-400">جاري التفكير...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative">
            <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسأل عن كتاب، أو اطلب تلخيصاً..."
                className="w-full pl-12 pr-4 py-3 bg-blue-600 border border-blue-500 rounded-xl text-white placeholder:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition disabled:opacity-50"
                disabled={loading}
            />
            <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Send className="w-4 h-4 transform rotate-180" />
            </button>
        </form>
      </div>
    </div>
  );
};