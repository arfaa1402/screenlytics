# 🚀 Screenlytics — AI Student Schedule Advisor & Digital Wellbeing Platform

Screenlytics is a full-stack digital wellbeing and academic planning platform designed for students. It helps users track daily screen time, compute burnout risk scores, manage daily planner tasks, and receive personalized schedule advice using an AI Academic Planning Assistant powered by **Gemini AI** and **MongoDB Atlas**.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), React Router v6, Context API, CSS Modules, Dark/Light Mode.
- **Backend**: Node.js, Express.js, Mongoose.
- **Database**: MongoDB Atlas / MongoDB Community Edition.
- **AI Integration**: Google Gemini API (`@google/generative-ai`).
- **Authentication**: JWT (JSON Web Tokens), `bcryptjs` password hashing.

---

## 📦 Project Structure

```
Screenlytics-main/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongoose database connection setup
│   ├── controllers/
│   │   ├── authController.js      # Register & Login
│   │   ├── chatbotController.js   # Gemini AI Chatbot & Schedule Analysis
│   │   ├── dashboardController.js # Today & Weekly Summary
│   │   ├── logController.js       # Screen Time & Burnout calculation
│   │   ├── plannerController.js   # Daily Tasks & Timetable CRUD
│   │   └── profileController.js   # User Profile, Notifications, Export
│   ├── middleware/
│   │   └── authMiddleware.js      # JWT authentication middleware
│   ├── models/
│   │   ├── User.js                # Student profile model
│   │   ├── ScreenLog.js           # Daily screen time log model
│   │   ├── BurnoutScore.js        # Historical burnout score model
│   │   ├── NotificationSettings.js# User preference settings model
│   │   ├── Task.js                # Planner schedule item model
│   │   ├── ChatSession.js         # Conversation session model
│   │   ├── ChatMessage.js         # Chat message & structured advice model
│   │   └── ScheduleSuggestion.js  # Generated schedule suggestions model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── chatbotRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── logRoutes.js
│   │   ├── plannerRoutes.js
│   │   └── profileRoutes.js
│   ├── scripts/
│   │   └── migrateFromMysql.js    # Data migration utility from MySQL to MongoDB
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── components/            # Navbar, Toast, ProtectedRoute, BurnoutRing
    │   ├── pages/                 # Dashboard, LogTime, Analytics, Planner, ScheduleAdvisor, Profile
    │   ├── utils/api.js           # Centralized API fetch helper
    │   ├── App.jsx                # Application routes
    │   └── main.jsx
    └── package.json
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the `backend/` directory using `.env.example`:

```env
# Server Configuration
PORT=5000

# MongoDB Connection String (Atlas or Local)
# Atlas Example: mongodb+srv://<user>:<password>@cluster0.mongodb.net/screenlytics?retryWrites=true&w=majority
MONGODB_URI=mongodb://127.0.0.1:27017/screenlytics

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d

# Google Gemini AI Key
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 🚀 Installation & Running Locally

### 1. Backend Setup

```bash
cd backend
npm install
```

Start the backend server:
```bash
npm start
```
*(Runs on `http://localhost:5000`)*

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5173` or `http://localhost:3000`)*

### 3. Database Data Migration (Optional)
If migrating existing data from a previous MySQL installation:
```bash
cd backend
npm run migrate
```

---

## 🤖 AI Student Schedule Advisor Features

1. **Schedule Context Analysis**: Analyzes student planner tasks, college timings, assignment deadlines, and screen time burnout scores.
2. **Categorized Recommendations**: Formats output into actionable sections:
   - ✅ **KEEP**: Positive routines to maintain.
   - 🔄 **CHANGE**: Timing or structure adjustments.
   - ➕ **ADD**: Revision blocks, breaks, or sleep buffers.
   - 📉 **REDUCE**: Unstructured screen scrolling or excessive gaming.
   - ⚠️ **AVOID**: Cramming, skipping meals, or late-night screen exposure.
3. **Session Persistence**: Saves all student-AI chat histories and schedule recommendations in MongoDB Atlas.

---

## 📡 REST API Reference

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` - Create student account.
- `POST /api/auth/login` - Authenticate and return JWT token.

### 📅 Planner (`/api/planner`)
- `GET /api/planner` - Retrieve user's schedule tasks.
- `POST /api/planner` - Create a new schedule task.
- `PATCH /api/planner/:id/toggle` - Toggle task completion status.
- `DELETE /api/planner/:id` - Delete task.

### 🤖 Chatbot & Advisor (`/api/chatbot`)
- `POST /api/chatbot/chat` - Send message to Gemini AI advisor.
- `GET /api/chatbot/sessions` - Get user's saved chat sessions.
- `POST /api/chatbot/sessions` - Start new chat session.
- `GET /api/chatbot/sessions/:id/messages` - Retrieve chat history.
- `DELETE /api/chatbot/sessions/:id` - Delete session.
- `POST /api/chatbot/analyze` - Perform detailed schedule analysis.

### 📊 Logs & Analytics (`/api/logs`)
- `GET /api/logs` - Retrieve screen time history.
- `POST /api/logs/upsert` - Log daily screen time & compute burnout score.
- `GET /api/logs/analytics` - Summary statistics for charts.

---

## 🧪 Testing

1. Open `http://localhost:5173/auth` and log in or create a student account.
2. Navigate to **Planner** (`/planner`) to add daily study and college tasks.
3. Navigate to **🤖 AI Advisor** (`/schedule-advisor`).
4. Click **✨ Full Schedule Analysis** or send custom prompts like *"I have exams next week. What should I change?"*.
5. Verify that responses display categorized advice cards (**KEEP**, **CHANGE**, **ADD**, **REDUCE**, **AVOID**).
