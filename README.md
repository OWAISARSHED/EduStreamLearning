# EduStream — AI-Powered Learning Management System

EduStream is a full-stack learning management platform with role-based dashboards for **students**, **mentors**, and **admins**. It features multilingual AI translation, document summarization, discussion forums, course management with modules/resources/assignments/quizzes, and a notification system.

## Tech Stack

| Layer     | Technology                                            |
| --------- | ----------------------------------------------------- |
| Frontend  | React 19, Vite, React Router, Lucide Icons            |
| Backend   | Node.js, Express.js, Mongoose                         |
| Database  | MongoDB (Atlas or local)                              |
| AI        | Google Gemini API (translation, summarization, chat) |
| Auth      | JWT (JSON Web Tokens) + bcryptjs                      |

## Features

### Student
- AI-powered multilingual prompt input (Urdu, Kashmiri, English)
- Document repository with AI auto-tagging
- AI document summarization & insights
- Discussion forum with verified mentor answers
- Course enrollment and progress tracking
- AI chat assistant

### Mentor
- Course creation with modules, resources (PDF, PPT, video, audio), assignments, quizzes
- Submit courses for admin approval
- Student progress tracking
- Review & verify forum threads
- AI-suggested resource tags

### Admin
- Dashboard with platform stats
- Course approvals — view full course details (resources by module, assignments, quizzes)
- Mentor approvals with ID verification
- User management (role changes, suspend)
- AI usage analytics (daily charts, per-type distribution, top users)
- Online time tracking for students & mentors

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (running locally or a connection string)
- Google Gemini API key (for AI features)

### 1. Clone & Install

```bash
cd edu-stream

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..
```

### 2. Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/edustream
JWT_SECRET=your-secret-key-change-in-production
GEMINI_API_KEY=your-google-gemini-api-key
```

### 3. Run the Application

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
npm run dev
```

Visit **http://localhost:5173**

### 4. Seed Initial Data (Optional)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@edustream.com","password":"admin123","role":"admin"}'
```

## Project Structure

```
edu-stream/
├── src/                    # React frontend
│   ├── components/         # Layout, guards, shared components
│   ├── context/            # Auth context
│   ├── pages/              # Page components
│   ├── services/           # API client
│   └── styles/             # CSS files
├── backend/
│   ├── models/             # Mongoose models
│   ├── routes/             # Express routes
│   ├── middleware/         # Auth middleware
│   ├── services/           # Gemini AI service
│   └── server.js           # Entry point
└── package.json
```

## API Endpoints

### Authentication
| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| POST   | `/api/auth/login`  | Login                |
| POST   | `/api/auth/register` | Register          |
| GET    | `/api/auth/me`     | Current user         |

### Courses
| Method | Endpoint                     | Description                |
| ------ | ---------------------------- | -------------------------- |
| POST   | `/api/courses`                 | Create course              |
| GET    | `/api/courses`                 | List courses               |
| GET    | `/api/courses/:id`             | Get course with resources  |
| PUT    | `/api/courses/:id`             | Update course              |
| DELETE | `/api/courses/:id`             | Delete course              |
| POST   | `/api/courses/:id/submit`      | Submit for approval        |
| POST   | `/api/courses/:id/approve`     | Approve course             |
| POST   | `/api/courses/:id/reject`      | Reject course              |
| POST   | `/api/courses/:id/enroll`      | Enroll student             |

### AI
| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/ai/translate`         | Translate text          |
| POST   | `/api/ai/summarize`         | Summarize document      |
| POST   | `/api/ai/suggest-tags`      | Suggest resource tags   |
| POST   | `/api/ai/chat`              | AI chat assistant       |
| GET    | `/api/ai/summaries`         | User's summaries        |
| GET    | `/api/ai/usage-analytics`   | Admin: AI usage data    |

### Notifications
| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/api/notifications`             | List notifications     |
| PUT    | `/api/notifications/:id/read`    | Mark one as read       |
| PUT    | `/api/notifications/read-all`    | Mark all as read       |

### Users
| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/users`                    | List users (admin)      |
| PUT    | `/api/users/:id`                | Update user (admin)     |
| GET    | `/api/users/online-time`        | User activity data      |
| GET    | `/api/users/stats`              | Platform stats (admin)  |
