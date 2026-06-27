import { useState } from 'react';
import { Sparkles, Send, History, Globe, MessageSquare, UserCheck } from 'lucide-react';
import { ai as aiApi, forum as forumApi } from '../services/api';
import '../styles/prompt.css';

export default function MultilingualPrompt() {
  const [query, setQuery] = useState('Mujhe apne React app mein state management ka masla hai...');
  const [translated, setTranslated] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const data = await aiApi.translate(query, 'en');
      setTranslated(data.ai_translated_text || '');
      setHistory(prev => [{ query, translated: data.ai_translated_text, time: new Date() }, ...prev].slice(0, 10));
    } catch (e) {
      setTranslated('Translation service unavailable. Please try again later.');
    }
    setLoading(false);
  };

  const handlePostToForum = async () => {
    const text = translated || query;
    try {
      await forumApi.createThread({ title: text.substring(0, 80) || 'Translated Query', body: text, channel: 'general' });
      alert('Posted to forum successfully!');
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmitToMentor = async () => {
    const text = translated || query;
    try {
      await forumApi.createThread({ title: 'Mentor Review: ' + (text.substring(0, 60) || 'Document'), body: text + '\n\n---\n*This document has been submitted for mentor review.*', channel: 'general' });
      alert('Submitted to mentor for review!');
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Multilingual Prompt Input</h1>
          <p className="page-subtitle">Linguistic Bridge — Type in your language, get AI-synthesized technical queries</p>
        </div>
      </div>

      <div className="prompt-container">
        <div className="prompt-card">
          <h3>Original Query</h3>
          <p className="card-subtitle">Type your question in your preferred language</p>
          <div className="detected-badge urdu">
            <Globe size={12} /> DETECTED: INPUT
          </div>
          <textarea
            className="prompt-textarea"
            placeholder="Type your question in English, Urdu, or Kashmiri..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            rows={5}
          />
          <div className="prompt-actions">
            <button className="btn-primary" onClick={handleTranslate} disabled={loading}>
              <Sparkles size={16} /> {loading ? 'Translating...' : 'Translate & Structure'}
            </button>
            <button className="btn-secondary" onClick={handlePostToForum}><Send size={16} /> Post to Forum</button>
          </div>
        </div>

        <div className="prompt-card">
          <h3>AI-Synthesized Technical Draft</h3>
          <p className="card-subtitle">AI restructured query in technical English</p>
          {translated && (
            <div className="detected-badge english">
              <Globe size={12} /> ENGLISH (TRANSLATED)
              <span className="confidence-tag high">HIGH FIDELITY</span>
            </div>
          )}
          <div className="translated-output">
            {translated || 'Translation will appear here after clicking "Translate & Structure".'}
          </div>
          <p className="disclaimer-text">AI-generated translation — please review before submitting</p>
          <div className="prompt-actions">
            <button className="btn-primary" onClick={handleSubmitToMentor}><Send size={16} /> Submit to Mentor</button>
            <button className="btn-secondary">Edit Draft</button>
            <button className="btn-secondary" onClick={handleTranslate}>Re-translate</button>
          </div>

          {history.length > 0 && (
            <div className="prompt-history" style={{ marginTop: 24 }}>
              <div className="dashboard-card-header">
                <h3>Recent Translations</h3>
              </div>
              {history.map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-icon"><History size={16} /></div>
                  <div className="history-content">
                    <h4>{(h.query || '').substring(0, 40)}...</h4>
                    <p>{h.time?.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
