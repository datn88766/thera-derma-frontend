import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/entities';

const QUICK_PROMPTS = [
  'Dịch vụ Facial phù hợp với da tôi?',
  'Giá các gói Facial là bao nhiêu?',
  'Đặt lịch hẹn như thế nào?',
  'Liệu trình 24K Gold có tác dụng gì?',
];

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles size={12} className="text-primary" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-foreground text-background'
            : 'bg-muted border border-border/50 text-foreground'
        }`}
        style={{ borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px' }}
      >
        {message.content}
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && !conversation) {
      initConversation();
    }
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const initConversation = async () => {
    setInitializing(true);
    const conv = await base44.agents.createConversation({
      agent_name: 'thera_derma_assistant',
      metadata: { name: 'Thera Derma Chat' },
    });
    setConversation(conv);

    base44.agents.subscribeToConversation(conv.id, (data) => {
      setMessages([...data.messages]);
      setLoading(false);
    });

    // Welcome message
    setMessages([{
      role: 'assistant',
      content: 'Xin chào! Tôi là trợ lý của Thera Derma. Tôi có thể giúp bạn tìm hiểu về các liệu trình Facial, tư vấn dịch vụ phù hợp, hoặc hỗ trợ đặt lịch hẹn. ✨',
    }]);

    setInitializing(false);
  };

  const sendMessage = async (text) => {
    const content = text || input.trim();
    if (!content || loading || !conversation) return;
    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    await base44.agents.addMessage(conversation, { role: 'user', content });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col shadow-2xl border border-border/60 bg-background overflow-hidden"
            style={{ height: '520px', borderRadius: '20px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground tracking-wide">Thera Derma</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-xs text-muted-foreground">Trợ lý tư vấn</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {initializing ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 size={20} className="text-primary animate-spin" />
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble key={i} message={msg} />
                  ))}
                  {loading && (
                    <div className="flex gap-2 justify-start">
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <Sparkles size={12} className="text-primary" />
                      </div>
                      <div className="px-4 py-3 bg-muted border border-border/50" style={{ borderRadius: '4px 16px 16px 16px' }}>
                        <div className="flex gap-1 items-center h-4">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-primary/60"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Prompts */}
            {messages.length <= 1 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 text-xs border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200"
                    style={{ borderRadius: '20px' }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-4 pb-4 pt-2 border-t border-border/50">
              <div className="flex gap-2 items-center bg-muted/50 border border-border/60 px-4 py-2.5" style={{ borderRadius: '14px' }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={loading || initializing}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-body"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading || initializing}
                  className="w-7 h-7 flex items-center justify-center rounded-full bg-foreground text-background disabled:opacity-30 hover:bg-primary transition-all duration-300"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-foreground text-background shadow-xl flex items-center justify-center hover:bg-primary transition-colors duration-500"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X size={22} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageCircle size={22} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}