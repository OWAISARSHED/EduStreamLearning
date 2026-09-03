# 🎓 EduStream — AI-Assisted Learning & Multilingual Ecosystem

![EduStream Banner](https://img.shields.io/badge/EduStream-v1.0-7030e0?style=for-the-badge&logo=react)
![Stack](https://img.shields.io/badge/Stack-MERN_--_MongoDB_Express_React_Node-00c853?style=for-the-badge)
![AI Powered](https://img.shields.io/badge/AI-Groq_%7C_OpenRouter_%7C_Whisper-ff9800?style=for-the-badge)

EduStream is a state-of-the-art **AI-Assisted Learning Platform** designed to empower students and mentors with real-time course progress tracking, protected video streaming, administrative verification portals, and multilingual AI assistance (supporting Urdu, Pashto, Kashmiri, Hindi, English, and Roman Urdu).

---

## 🚀 Key Features

### 👨‍🎓 1. Student Learning Platform
- **Course Progress Tracking:** Real-time progress bar recalculating `% Completed` dynamically as videos and resources are watched.
- **In-App Media Viewer:** Secure video streaming (`.mp4`, `.webm`) and PDF viewer embedded directly inside the browser with right-click and download protections (`controlsList="nodownload"`).
- **My Courses Portal:** Quick access to all active learning paths and completion certificates.

### 👨‍🏫 2. Mentor Workspace
- **HD Course Uploads:** Supports up to **500MB** HD video lectures, module resources, assignments, and quizzes.
- **Student Progress & Completion Tracker:** Dedicated dashboard displaying every enrolled student's progress bar, percentage completion, and green `✓ Course Completed` badges.
- **Instant Completion Alerts:** Automated Socket.io & DB notifications sent to the mentor when a student completes a course.

### 🛡️ 3. Admin Verification & Approval Panel
- **Course Approval Workflow:** Complete course review dashboard with inline **`▶ Play Video`** and **`👁 View File`** media modals.
- **Mentor Verification:** Approve or reject new mentor registrations securely.
- **System Audit Logs & Monitoring:** Track platform activity, online user statistics, and user account status.

### 🤖 4. AI Insights & Multilingual Engine
- **Vision AI & Document OCR:** Built-in OpenRouter Vision (Gemini Flash) & `pdf-parse` for extracting insights from uploaded document files and images.
- **Fast AI Assistant:** Powered by Groq AI SDK (`qwen/qwen3.8-27b`) for instant context-aware study Q&A.
- **Voice Queries (Speech-to-Text):** Groq Whisper model (`whisper-large-v3-turbo`) for audio command processing.
- **Multilingual Support:** Native assistance in **Urdu, Pashto, Kashmiri, Hindi, English, and Roman Urdu**.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 (via Vite) |
| **Styling & UI** | Vanilla CSS3 (Custom Glassmorphism Dark Theme & CSS Grid) |
| **Backend Framework** | Node.js (v18+) + Express.js (v5) |
| **Database & ORM** | MongoDB + Mongoose ORM |
| **Real-time WebSockets** | Socket.io (Client & Server) |
| **AI LLM Inference** | Groq AI SDK (`qwen/qwen3.8-27b`) |
| **Vision & OCR** | OpenRouter Vision API (Gemini Flash) + `pdf-parse` |
| **Speech-to-Text** | Groq Whisper Turbo (`whisper-large-v3-turbo`) |
| **Authentication** | JSON Web Tokens (JWT) + Bcrypt.js |
| **API Documentation** | Swagger UI (`/api-docs`) |

---

## 📂 Project Structure

```
EduStream/
├── backend/
│   ├── config/             # Database connection & system configs
│   ├── middleware/         # JWT Auth & Role-Based authorization guards
│   ├── models/             # Mongoose Schemas (User, Course, VideoProgress, etc.)
│   ├── routes/             # REST API endpoints (courses, users, ai, ocr, auth)
│   ├── services/           # AI & Email service wrappers
│   ├── uploads/            # Local media file storage (.gitignore excluded)
│   ├── .env.example        # Environment variables template
│   └── server.js           # Backend entry point (Express + WebSockets)
├── src/
│   ├── components/         # Reusable UI components & Protected Guards
│   ├── context/            # AuthContext & Global state management
│   ├── pages/              # App routes (Dashboard, Viewer, Admin, Mentor, AI)
│   ├── services/           # Frontend API fetch services
│   ├── styles/             # Modular CSS design system files
│   └── App.jsx             # React Router routing configuration
├── index.html              # Frontend entry HTML
├── technologies_used.txt   # Detailed technology stack document
└── README.md               # Repository documentation
```

---

## 🔑 Environment Variables Setup

Create a `.env` file in the `backend` folder using the provided template `.env.example`:

```env
# Database & Auth
MONGODB_URI=mongodb://localhost:27017/edustream
JWT_SECRET=your_jwt_secret_key_here
PORT=5000

# AI Provider Keys
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_STT_MODEL=whisper-large-v3-turbo

OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-flash-1.5-exp

# Application URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

> ⚠️ **Security Note:** Never commit your secret `.env` file or API keys to GitHub!

---

## ⚡ Quick Start Guide

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/OWAISARSHED/EduStreamLearning.git
cd EduStreamLearning
```

### 2️⃣ Start Backend Server
```bash
cd backend
npm install
# Ensure MongoDB is running locally or provide MONGODB_URI in .env
node server.js
```
*Backend will run on `http://localhost:5000` (Swagger docs at `http://localhost:5000/api-docs`).*

### 3️⃣ Start Frontend Development Server
```bash
# In the root folder (or terminal 2)
npm install
npm run dev
```
*Frontend will run on `http://localhost:5173`.*

---

## 🔑 Default System Test Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| 🔑 **Admin** | `admin@edustream.com` | `Admin@123` |
| 👨‍🏫 **Mentor** | `mentor1@edustream.com` | `Mentor@123` |
| 👨‍🎓 **Student** | `student1@edustream.com` | `Student@123` |

---

## 👥 Prepared By
- **Owais Arshad** (Team Lead)
- **Muhammad Saqib** (Team Member)

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
