import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2 } from 'lucide-react';
import { ai } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/chat.css';

export default function AIChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', content: `Hello ${user?.name || 'there'}! I'm your AI learning assistant. Ask me anything about your studies — I'll respond in your language.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const data = await ai.chat(userMsg, history);
      setMessages(prev => [...prev, { role: 'ai', content: data.reply }]);
    } catch (e) {
      const msg = e.message?.includes('fetch') 
        ? '❌ Backend server not running. Please start the backend with: node server.js'
        : `❌ ${e.message || 'AI unavailable. Please try again.'}`;
      setMessages(prev => [...prev, { role: 'ai', content: msg }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      { role: 'ai', content: `Hello ${user?.name || 'there'}! I'm your AI learning assistant. Ask me anything about your studies — I'll respond in your language.` }
    ]);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="page-title">AI Chat</h1>
          <p className="page-subtitle">Ask questions in any language — I'll respond in your language</p>
        </div>
        <button className="chat-clear-btn" onClick={clearChat} title="Clear conversation">
          <Trash2 size={16} />
          New Chat
        </button>
      </div>
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}`}>
            <div className="chat-msg-avatar">
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            <div className="chat-msg-content">
              <div className="chat-msg-text">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-msg chat-msg-ai">
            <div className="chat-msg-avatar"><Bot size={18} /></div>
            <div className="chat-msg-content">
              <div className="chat-msg-text">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Type your question here..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
