import React, { useState, useRef, useEffect } from 'react';
import { Activity, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';

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
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'r',
        role: 'system',
        agent: data.agent || "Core Intelligence",
        content: data.reply || "Sorry, I couldn't process that request."
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
    <div className="flex-1 flex flex-col h-full overflow-hidden font-sans" style={{ background: '#0D0D0D', color: '#F8F9FA' }}>
      <style>{`
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .chat-scroll::-webkit-scrollbar-thumb { background: rgba(0,209,193,0.2); border-radius: 2px; }
        .dark-prose p { color: #9CA3AF !important; }
        .dark-prose strong { color: #F8F9FA !important; }
        .dark-prose ul, .dark-prose ol { color: #9CA3AF !important; }
        .dark-prose h1, .dark-prose h2, .dark-prose h3 { color: #F8F9FA !important; }
        .dark-prose code { background: rgba(0,209,193,0.1) !important; color: #00D1C1 !important; padding: 2px 6px; border-radius: 4px; }
        .dark-prose li::marker { color: #00D1C1; }
      `}</style>

      {/* Header */}
      <header
        className="h-14 flex items-center justify-center shrink-0"
        style={{ background: '#111318', borderBottom: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Activity className="w-4 h-4" style={{ color: '#00D1C1' }} />
          </motion.div>
          <span className="text-sm uppercase tracking-widest font-semibold" style={{ color: '#6B7280' }}>Co-Pilot Chat</span>
          <div className="ml-2 w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00D1C1', boxShadow: '0 0 6px #00D1C1' }} />
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center chat-scroll">
        <div className="w-full max-w-[700px] px-4 py-8 space-y-6">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
            >
              {msg.role === 'user' ? (
                <div
                  className="rounded-2xl p-4 max-w-[85%]"
                  style={{
                    background: 'rgba(0,209,193,0.1)',
                    border: '1px solid rgba(0,209,193,0.2)',
                    color: '#F8F9FA',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-[90%] flex flex-col">
                  {msg.agent && (
                    <div className="flex items-center gap-2 mb-2 pl-1">
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
                        style={{ background: 'linear-gradient(135deg,#00D1C1,#00BCAE)', boxShadow: '0 0 8px rgba(0,209,193,0.4)' }}
                      >
                        M
                      </div>
                      <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: '#4B5563' }}>{msg.agent}</span>
                    </div>
                  )}
                  <div
                    className="rounded-2xl rounded-tl-sm p-5 leading-relaxed"
                    style={{
                      background: '#111318',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#9CA3AF',
                    }}
                  >
                    <div className="dark-prose text-sm space-y-3 prose prose-invert max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                    {msg.attachment && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        {msg.attachment}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start w-full">
              <div
                className="rounded-2xl rounded-tl-sm p-5 flex items-center gap-2"
                style={{ background: '#111318', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#00D1C1', animationDelay: `${delay}ms`, boxShadow: '0 0 6px #00D1C1' }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="shrink-0 pb-6 pt-2 flex flex-col items-center"
        style={{ background: 'linear-gradient(to top, #0D0D0D 70%, transparent)' }}
      >
        <div className="w-full max-w-[700px] px-4">
          {/* Quick suggestions */}
          <div className="flex flex-wrap gap-2 mb-4 justify-start">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSend(undefined, suggestion)}
                className="rounded-full px-4 py-1.5 text-xs transition-all hover:border-teal-500/40"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#6B7280',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,209,193,0.3)';
                  e.currentTarget.style.color = '#00D1C1';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#6B7280';
                }}
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
              className="w-full rounded-full py-4 pl-6 pr-14 focus:outline-none transition-all"
              style={{
                background: '#111318',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#F8F9FA',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(0,209,193,0.4)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,209,193,0.1)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-full flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg,#00D1C1,#00BCAE)', boxShadow: '0 0 16px rgba(0,209,193,0.4)' }}
            >
              <Send className="w-4 h-4 ml-0.5 text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
