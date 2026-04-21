import React, { useState, useRef, useEffect } from 'react';
import { Activity, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'system';
  content: string;
  agent?: string;
  attachment?: React.ReactNode;
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'system',
    agent: 'Core Intelligence',
    content: "**Quick Brief**\n\nI am actively monitoring Southeast Asia signals for your business.\n\nTop priorities today:\n- Restock jasmine rice now to avoid 15-20% cost jump risk.\n- Prepare for palm oil cost pressure.\n- Capture matcha demand while competition is still early."
  },
  {
    id: 'm2',
    role: 'user',
    content: 'Give me a plain-language plan for this week.'
  }
];

const SUGGESTIONS = [
  'What should I restock now?',
  'How should I price this week?',
  'Should I add matcha now?',
  'When do I need extra staff?'
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent, overridingText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overridingText || input;
    if (!textToSend.trim() || isLoading) return;

    setInput("");
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are MerchantMind, an AI co-pilot for SME merchants in Southeast Asia. You watch world signals (supply chain, weather, local trends) to give business advice. The merchant is Siti, running "Siti's Bubble Tea" in Petaling Jaya, Malaysia. Respond concisely, professionally, and use formatting. Keep answers strictly business-focused, practical, and data-driven.`;
      
      const historyText = messages.map(m => `${m.role === 'user' ? 'Merchant' : 'MerchantMind'}: ${m.content}`).join('\\n');
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `${historyText}\\nMerchant: ${textToSend}`,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });
      
      const replyContent = response.text || "Sorry, I couldn't process that request.";

      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'r',
        role: 'system',
        agent: "Core Intelligence",
        content: replyContent
      }]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'e',
        role: 'system',
        agent: "System",
        content: "I'm currently unable to retrieve the latest live data. Please try again later."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] text-[#1A1A1A] h-full overflow-hidden">
      <header className="h-16 flex items-center justify-center border-b border-gray-200 shrink-0 bg-white shadow-sm">
        <div className="text-sm uppercase tracking-widest text-gray-400 font-semibold flex items-center space-x-2">
          <Activity className="w-4 h-4 text-[#00D1C1]" />
          <span>Co-Pilot Chat</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">
        <div className="w-full max-w-[700px] px-4 py-8 space-y-6">
          {messages.map(msg => (
            <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
              {msg.role === 'user' ? (
                <div className="bg-white border border-[#00D1C1]/20 shadow-sm text-gray-900 rounded-2xl p-4 max-w-[85%]">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-[90%] flex flex-col">
                  {msg.agent && (
                    <div className="flex items-center space-x-2 mb-2 text-xs uppercase tracking-wide text-gray-400 font-semibold pl-1">
                      <div className="w-4 h-4 rounded bg-[#00D1C1] flex items-center justify-center shrink-0 text-white font-bold text-[10px]">M</div>
                      <span>{msg.agent}</span>
                    </div>
                  )}
                  <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm p-5 text-gray-700 leading-relaxed">
                    <div className="markdown-body text-sm space-y-4 prose max-w-none">
                       <Markdown>{msg.content}</Markdown>
                    </div>
                    {msg.attachment && (
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        {msg.attachment}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start w-full">
              <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm p-5 flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="shrink-0 pb-6 pt-2 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA] flex flex-col items-center">
        <div className="w-full max-w-[700px] px-4">
          <div className="flex flex-wrap gap-2 mb-4 justify-start">
            {SUGGESTIONS.map((suggestion, i) => (
              <button 
                key={i}
                onClick={() => handleSend(undefined, suggestion)}
                className="bg-white hover:bg-gray-50 border border-gray-200 rounded-full px-4 py-1.5 text-xs text-gray-500 transition-colors shadow-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
          
          <form onSubmit={handleSend} className="relative w-full">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask MerchantMind..." 
              className="w-full bg-white border border-gray-200 text-gray-900 rounded-full py-4 pl-6 pr-14 focus:outline-none focus:ring-2 focus:ring-[#00D1C1]/50 shadow-sm placeholder:text-gray-400"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-[#00D1C1] hover:opacity-90 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
