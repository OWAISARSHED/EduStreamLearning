const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const pdfParse = require('pdf-parse'); // top-level import — fixes "not a function"
const { authenticate } = require('../middleware/auth');
const { callAI } = require('../services/ollama');

const router = express.Router();

// Temp storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve(__dirname, '../uploads/ocr_temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `ocr_${Date.now()}_${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif',
      'image/webp', 'image/bmp', 'application/pdf',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images (JPG, PNG, GIF, WEBP, BMP) and PDF files are allowed.'));
  },
});

// ── Extract text from PDF (fast, pure JS) ─────────────────────
async function extractTextFromPDF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pdfModule = require('pdf-parse');
  if (typeof pdfModule === 'function') {
    const data = await pdfModule(buffer);
    return (data.text || '').trim();
  }
  if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: buffer });
    const res = await parser.getText();
    if (typeof res === 'string') return res.trim();
    if (res && res.text) return res.text.trim();
    if (res && Array.isArray(res.pages)) return res.pages.map(p => p.text || '').join('\n').trim();
  }
  return '';
}


// ── Extract text from Image via OpenRouter Vision ─────────────
async function extractTextFromImage(filePath, mimeType) {
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'google/gemini-flash-1.5:free',  // fast vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL text visible in this image. Return only the extracted text exactly as it appears, preserving layout where possible. If the image contains Urdu, Arabic, or other scripts, extract those too.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUrl },
            },
          ],
        },
      ],
      max_tokens: 4096,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5173',
        'X-Title': 'EduStream OCR',
      },
      timeout: 30000,
    }
  );

  return response.data.choices[0]?.message?.content?.trim() || '';
}

// ── AI Analysis prompt (multilingual) ────────────────────────
const ANALYSIS_SYSTEM_PROMPT = `You are an AI educational assistant for EduStream.

CRITICAL LANGUAGE RULE: Detect what language the extracted text is written in, and respond in that SAME language. 
- If text is in Urdu → respond in Urdu
- If text is in English → respond in English  
- If text is in Pashto → respond in Pashto
- If text is in Kashmiri → respond in Kashmiri
- If text is in Hindi → respond in Hindi
- If mixed → use the dominant language
Never switch languages. Never explain this rule.

Analyze the educational content and return a JSON object with:
- summary (string): 3-5 sentence summary
- key_points (array of strings): 4-6 important points
- subject_area (string): subject/topic name
- difficulty_level (string): "beginner" | "intermediate" | "advanced"
- actionable_tasks (array of strings): 3-4 suggested actions
- questions (array of strings): 3 comprehension questions

Return ONLY valid JSON, no markdown, no code blocks.`;

// ── Route: POST /api/ocr/analyze ─────────────────────────────
router.post('/analyze', authenticate, upload.single('file'), async (req, res) => {
  const filePath = req.file?.path;
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const isPDF = req.file.mimetype === 'application/pdf';
    let extractedText = '';

    if (isPDF) {
      extractedText = await extractTextFromPDF(filePath);
    } else {
      extractedText = await extractTextFromImage(filePath, req.file.mimetype);
    }

    if (!extractedText || extractedText.length < 5) {
      return res.status(422).json({
        message: 'Could not extract readable text. Try a clearer image or different file.',
        extracted_text: '',
      });
    }

    // AI analysis
    const aiResponse = await callAI([
      { role: 'system', content: ANALYSIS_SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this extracted text:\n\n${extractedText.slice(0, 8000)}` },
    ]);

    let analysis;
    try {
      analysis = JSON.parse(aiResponse.replace(/```json|```/g, '').trim());
    } catch {
      analysis = {
        summary: aiResponse,
        key_points: [],
        subject_area: 'Unknown',
        difficulty_level: 'intermediate',
        actionable_tasks: [],
        questions: [],
      };
    }

    res.json({
      success: true,
      file_name: req.file.originalname,
      file_type: isPDF ? 'pdf' : 'image',
      extracted_text: extractedText.slice(0, 2000),
      extracted_chars: extractedText.length,
      analysis,
    });
  } catch (error) {
    console.error('[OCR] Error:', error.message);
    res.status(500).json({ message: error.message || 'Analysis failed. Please try again.' });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
  }
});

module.exports = router;
