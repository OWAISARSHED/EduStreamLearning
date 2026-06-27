const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(__dirname, '../../serviceorchestrator-496409-3f2821217641.json');

const PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'serviceorchestrator-496409';
const MODEL = process.env.GOOGLE_MODEL || 'gemini-2.5-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

let cachedToken = null;
let tokenExpiry = 0;

const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const auth = new GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ['https://www.googleapis.com/auth/generative-language'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  cachedToken = token.token;
  const expiresIn = token.res?.data?.expires_in || 3600;
  tokenExpiry = Date.now() + (expiresIn - 60) * 1000;
  return cachedToken;
};

const callGemini = async (contents, systemInstruction = '') => {
  try {
    const token = await getAccessToken();
    const url = `${API_BASE}/models/${MODEL}:generateContent`;

    const body = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } };
    if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

    const response = await axios.post(url, body, {
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    });

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API error:', error.message);
    if (error.response) console.error('Status:', error.response.status, 'Data:', JSON.stringify(error.response.data).slice(0, 500));
    throw new Error('AI service unavailable');
  }
};

const toGeminiContent = (role, text) => ({
  role: role === 'ai' || role === 'assistant' || role === 'model' ? 'model' : 'user',
  parts: [{ text }],
});

const detectLanguage = (text) => {
  const arabicScript = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const devanagari = /[\u0900-\u097F]/;
  if (devanagari.test(text)) return 'Hindi';
  if (arabicScript.test(text)) return 'Urdu';
  return 'English';
};

const translatePrompt = async (text, targetLang) => {
  const langMap = { en: 'English', ur: 'Urdu', ks: 'Kashmiri', ps: 'Pashto' };
  const system = `You are a translator for educational content. Translate the user's text to ${langMap[targetLang] || 'English'}. Respond with ONLY the translated text, no explanations or notes.`;
  return callGemini([toGeminiContent('user', text)], system);
};

const summarizeDocument = async (text) => {
  const system = 'You are an AI assistant that summarizes educational documents. Return ONLY a valid JSON object with these exact fields: summary_text (string), core_concepts (array of strings), actionable_tasks (array of {task: string, completed: false}), key_deadlines (array of {label: string, date: string}). No markdown, no code blocks, no extra text.';
  const response = await callGemini([toGeminiContent('user', `Summarize this document:\n\n${text}`)], system);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return { summary_text: response, core_concepts: [], actionable_tasks: [], key_deadlines: [] };
  }
};

const suggestTags = async (title, description) => {
  const system = 'You are an AI that suggests relevant tags for educational resources. Return ONLY a JSON array of tag strings, no other text or markdown.';
  const response = await callGemini([toGeminiContent('user', `Suggest 3-5 tags for a resource titled "${title}" with description: "${description}"`)], system);
  try {
    return JSON.parse(response.replace(/```json|```/g, '').trim());
  } catch {
    return response.split(',').map(t => t.trim()).filter(Boolean);
  }
};

const chatWithAI = async (message, history = []) => {
  const detectedLang = detectLanguage(message);
  const system = `You are an AI learning assistant for EduStream, an educational platform.

STRICT LANGUAGE RULE: Detect the language the user writes in and ALWAYS respond in that EXACT same language. If the user writes in ${detectedLang}, you MUST respond in ${detectedLang}. Never switch languages. Never explain this rule. This is mandatory.

Supported languages: English, Urdu, Kashmiri, Pashto, Hindi.
Be supportive, educational, and concise.`;

  const contents = history.map(m => toGeminiContent(m.role, m.content));
  contents.push(toGeminiContent('user', message));

  return callGemini(contents, system);
};

module.exports = { callGemini, translatePrompt, summarizeDocument, suggestTags, chatWithAI };
