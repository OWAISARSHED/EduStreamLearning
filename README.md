# EduStream — AI-Powered Learning Management System

EduStream is a full-stack learning management platform with role-based dashboards for **students**, **mentors**, and **admins**. It features multilingual AI translation, document summarization, discussion forums, course management with modules/resources/assignments/quizzes, and a notification system.

## Tech Stack

| Layer       | Technology                                                       |
| ----------- | ---------------------------------------------------------------- |
| Frontend    | React 19, Vite, React Router, Lucide Icons, i18next, highlight.js |
| Backend     | Node.js, Express.js, Mongoose, Nodemailer                        |
| Database    | MongoDB (Atlas or local)                                         |
| AI          | Google Gemini API (translation, summarization, chat)             |
| Auth        | JWT (JSON Web Tokens) + bcryptjs                                 |
| API Docs    | Swagger / OpenAPI 3.0 (swagger-jsdoc, swagger-ui-express)        |
| Testing     | Jest, Supertest                                                  |
| Container   | Docker, Docker Compose                                           |
| i18n        | i18next, react-i18next, i18next-browser-languagedetector         |

## Features

### Student
- AI-powered multilingual prompt input (Urdu, Kashmiri, English)
- Document repository with AI auto-tagging
- AI document summarization & insights
- Discussion forum with verified mentor answers
- Course enrollment and progress tracking
- AI chat assistant
- Multilingual UI (English / Urdu toggle)

### Mentor
- Course creation with modules, resources (PDF, PPT, video, audio), assignments, quizzes
- Submit courses for admin approval
- Student progress tracking
- Review & verify forum threads
- AI-suggested resource tags
- Syntax highlighting in forum posts (code blocks)

### Admin
- Dashboard with platform stats
- Course approvals — view full course details (resources by module, assignments, quizzes)
- Mentor approvals with ID verification
- User management (role changes, suspend)
- AI usage analytics (daily charts, per-type distribution, top users)
- Online time tracking for students & mentors
- Admin password complexity enforcement (8+ chars, uppercase, lowercase, number, special char)

### Global
- **i18n & RTL Support** — Full English/Urdu localization with right-to-left (RTL) layout switching for Urdu
- **WCAG 2.1 Level AA** — Skip navigation link, ARIA roles/labels, keyboard accessibility, semantic landmarks
- **Email Integration** — Password reset via email (Nodemailer/SMTP), notification emails
- **Swagger API Docs** — Interactive OpenAPI 3.0 documentation at `/api-docs`
- **Backend Unit Tests** — Model validation, password policy, email service, audit logging (Jest + Supertest)
- **Docker Containerization** — Dockerfile + Docker Compose for backend and frontend services
- **Syntax Highlighting** — Automatic code block detection and highlighting in the discussion forum

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (running locally or a connection string)
- Google Gemini API key (for AI features)
- SMTP credentials (for password reset emails — optional for development)

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

# SMTP (optional — for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@edustream.com
CLIENT_URL=http://localhost:5173
```

### 3. Run the Application

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — Frontend
npm run dev
```

Visit **http://localhost:5173**

### 3b. Run with Docker

```bash
docker compose up --build
```

- Backend: **http://localhost:5000**
- Frontend: **http://localhost:3000**
- Swagger Docs: **http://localhost:5000/api-docs**

### 4. Run Tests

```bash
cd backend && npm test
```

### 5. Seed Initial Data (Optional)

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@edustream.com","password":"Admin@123","role":"admin"}'
```

> **Note:** Admin passwords require at least 8 characters including uppercase, lowercase, number, and special character.

## Project Structure

```
edu-stream/
├── src/                          # React frontend
│   ├── components/
│   │   └── layout/               # Layout, Sidebar, TopBar (with language toggle)
│   ├── context/                  # Auth context
│   ├── pages/                    # Page components
│   ├── services/                 # API client, socket.js
│   ├── styles/                   # CSS with RTL overrides
│   ├── i18n.js                   # i18next configuration (en/ur)
│   └── main.jsx                  # Entry point with i18n + Suspense
├── backend/
│   ├── models/                   # Mongoose models
│   ├── routes/                   # Express routes (with Swagger JSDoc annotations)
│   ├── middleware/               # Auth middleware
│   ├── services/                 # Gemini AI service, email service
│   ├── __tests__/                # Jest unit tests
│   ├── swagger.js                # OpenAPI 3.0 spec
│   ├── setup.js                  # Test setup (Express app factory)
│   ├── jest.config.js            # Jest configuration
│   └── server.js                 # Entry point (with Swagger UI mount)
├── Dockerfile                    # Backend Docker image
├── docker-compose.yml            # Backend + Frontend services
└── package.json
```

## API Endpoints

### Authentication
| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| POST   | `/api/auth/login`                 | Login                          |
| POST   | `/api/auth/register`              | Register (passwords ≥6 chars; admin: complexity enforced) |
| GET    | `/api/auth/me`                    | Current user                   |
| POST   | `/api/auth/forgot-password`       | Request password reset email   |
| POST   | `/api/auth/reset-password/:token` | Reset password with token      |

### Courses
| Method | Endpoint                     | Description                |
| ------ | ---------------------------- | -------------------------- |
| POST   | `/api/courses`               | Create course              |
| GET    | `/api/courses`               | List courses               |
| GET    | `/api/courses/:id`           | Get course with resources  |
| PUT    | `/api/courses/:id`           | Update course              |
| DELETE | `/api/courses/:id`           | Delete course              |
| POST   | `/api/courses/:id/submit`    | Submit for approval        |
| POST   | `/api/courses/:id/approve`   | Approve course             |
| POST   | `/api/courses/:id/reject`    | Reject course              |
| POST   | `/api/courses/:id/enroll`    | Enroll student             |

### AI
| Method | Endpoint                  | Description              |
| ------ | ------------------------- | ------------------------ |
| POST   | `/api/ai/translate`       | Translate text           |
| POST   | `/api/ai/summarize`       | Summarize document       |
| POST   | `/api/ai/suggest-tags`    | Suggest resource tags    |
| POST   | `/api/ai/chat`            | AI chat assistant        |
| GET    | `/api/ai/summaries`       | User's summaries         |
| GET    | `/api/ai/usage-analytics` | Admin: AI usage data     |

### Forum
| Method | Endpoint                              | Description              |
| ------ | ------------------------------------- | ------------------------ |
| GET    | `/api/forum/threads`                  | List threads             |
| POST   | `/api/forum/threads`                  | Create thread            |
| GET    | `/api/forum/threads/:id`              | Get thread with replies  |
| PUT    | `/api/forum/threads/:id`              | Update thread            |
| DELETE | `/api/forum/threads/:id`              | Delete thread            |
| POST   | `/api/forum/threads/:id/verify`       | Verify thread (mentor)   |
| POST   | `/api/forum/threads/:id/replies`      | Post reply               |

### Resources
| Method | Endpoint                             | Description                    |
| ------ | ------------------------------------ | ------------------------------ |
| GET    | `/api/resources`                     | List resources                 |
| POST   | `/api/resources`                     | Create resource                |
| GET    | `/api/resources/:id`                 | Get resource with access log   |
| PUT    | `/api/resources/:id`                 | Update resource                |
| DELETE | `/api/resources/:id`                 | Delete resource                |
| POST   | `/api/resources/:id/access`          | Log resource access            |
| GET    | `/api/resources/access-logs`         | Access logs (admin)            |
| GET    | `/api/resources/:id/versions`        | Version history                |

### Users
| Method | Endpoint                      | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/users`                  | List users (admin)       |
| PUT    | `/api/users/:id`              | Update user (admin)      |
| POST   | `/api/users/create`           | Create user (admin)      |
| DELETE | `/api/users/:id`              | Delete user (admin)      |
| GET    | `/api/users/mentor-stats`     | Mentor dashboard stats   |
| GET    | `/api/users/online-time`      | User activity data       |
| GET    | `/api/users/stats`            | Platform stats (admin)   |

### Notifications
| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/api/notifications`           | List notifications      |
| PUT    | `/api/notifications/:id/read`  | Mark one as read        |
| PUT    | `/api/notifications/read-all`  | Mark all as read        |

### Milestones
| Method | Endpoint               | Description         |
| ------ | ---------------------- | ------------------- |
| GET    | `/api/milestones`      | List milestones     |
| POST   | `/api/milestones`      | Create milestone    |
| PUT    | `/api/milestones/:id`  | Update milestone    |

### API Documentation (Swagger)
| Method | Endpoint      | Description                        |
| ------ | ------------- | ---------------------------------- |
| GET    | `/api-docs`   | Interactive Swagger UI (OpenAPI 3) |

## Additional Resources

- **Swagger API Docs** — Visit `/api-docs` on the backend for interactive API exploration
- **Docker** — Use `docker compose up --build` to run the full stack in containers
- **Tests** — Run `cd backend && npm test` for unit tests (coverage: models, password policy, email, audit logging)
- **i18n** — Toggle language between English and Urdu using the language button in the top bar; Urdu enables RTL layout
