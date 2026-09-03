const Groq = require('groq-sdk');
const axios = require('axios');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';

// ── Primary: Groq ─────────────────────────────────────────────
const callGroq = async (messages) => {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content || '';
};

// ── Fallback: OpenRouter ──────────────────────────────────────
const callOpenRouter = async (messages) => {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model: OPENROUTER_MODEL, messages, temperature: 0.7, max_tokens: 4096 },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'EduStream',
      },
      timeout: 60000,
    }
  );
  return response.data.choices[0]?.message?.content || '';
};

// ── Unified AI call (Groq first, OpenRouter fallback) ─────────
const callAI = async (messages) => {
  try {
    const result = await callGroq(messages);
    if (result) return result;
    throw new Error('Empty response from Groq');
  } catch (groqErr) {
    console.warn('[Groq] Error, trying OpenRouter:', groqErr.message);
    try {
      const result = await callOpenRouter(messages);
      if (result) return result;
      throw new Error('Empty response from OpenRouter');
    } catch (orErr) {
      console.error('[OpenRouter] Error:', orErr.message);
      throw new Error('AI service unavailable. Please try again.');
    }
  }
};

// ── Language detection ────────────────────────────────────────
const detectLanguage = (text) => {
  const arabicScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const devanagari = /[\u0900-\u097F]/;
  if (devanagari.test(text)) return 'Hindi';
  if (arabicScript.test(text)) return 'Urdu';
  return 'English';
};

// ── Translate ─────────────────────────────────────────────────
const translatePrompt = async (text, targetLang) => {
  const langMap = { en: 'English', ur: 'Urdu', ks: 'Kashmiri', ps: 'Pashto' };
  const target = langMap[targetLang] || 'English';
  return callAI([
    { role: 'system', content: `You are a translator for educational content. Translate the user's text to ${target}. Respond with ONLY the translated text, no explanations or notes.` },
    { role: 'user', content: text },
  ]);
};

// ── Summarize Document ────────────────────────────────────────
const summarizeDocument = async (text) => {
  const response = await callAI([
    {
      role: 'system',
      content: 'You are an AI assistant that summarizes educational documents. Return ONLY a valid JSON object with these exact fields: summary_text (string), core_concepts (array of strings), actionable_tasks (array of {task: string, completed: false}), key_deadlines (array of {label: string, date: string}). No markdown, no code blocks, no extra text.',
    },
    { role: 'user', content: `Summarize this document:\n\n${text}` },
  ]);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return { summary_text: response, core_concepts: [], actionable_tasks: [], key_deadlines: [] };
  }
};

// ── Suggest Tags ──────────────────────────────────────────────
const suggestTags = async (title, description) => {
  const response = await callAI([
    { role: 'system', content: 'You are an AI that suggests relevant tags for educational resources. Return ONLY a JSON array of tag strings, no other text or markdown.' },
    { role: 'user', content: `Suggest 3-5 tags for a resource titled "${title}" with description: "${description}"` },
  ]);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return response.split(',').map(t => t.trim()).filter(Boolean);
  }
};

// ── AI Chat ───────────────────────────────────────────────────
const chatWithAI = async (message, history = []) => {
  const detectedLang = detectLanguage(message);
  const systemPrompt = `You are an AI learning assistant for EduStream, an educational platform for students in Pakistan and South Asia.

STRICT LANGUAGE RULE — This is your most important instruction:
- Detect what language the user is writing in
- ALWAYS respond in that EXACT same language
- Current detected language: ${detectedLang}

Language mapping:
- Urdu script (اردو) → respond in Urdu
- English → respond in English
- Pashto (پښتو) → respond in Pashto
- Kashmiri (کشمیری) → respond in Kashmiri
- Hindi (हिंदी) → respond in Hindi
- Roman Urdu (latin letters but Urdu words like "kya", "hai", "nahi") → respond in Roman Urdu

NEVER switch to English if user writes in Urdu or any other language.
NEVER explain or mention this language rule.
Be supportive, educational, helpful, and concise.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role === 'ai' || m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
    { role: 'user', content: message },
  ];

  return callAI(messages);
};


module.exports = { callAI, translatePrompt, summarizeDocument, suggestTags, chatWithAI };
