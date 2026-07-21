# HeckNest — Hackathon Management Platform

> A full-stack web application designed to streamline hackathon organization, team formation, project submission, judge scoring, and real-time leaderboard generation.

---

## 🔗 Live Demo

- **Frontend App**: [Deployed Frontend Link Placeholder]
- **Backend API**: [Deployed Backend API Link Placeholder]

---

## 📌 Overview

Organizing and managing hackathons traditional relies on fragmented tools like Google Forms, Excel spreadsheets, and WhatsApp groups. **HeckNest** unifies the entire hackathon lifecycle into a single platform. It provides dedicated role-based portals for **Organizers** to host and manage events, **Participants** to build teams and submit projects, **Judges** to evaluate submissions using structured criteria, and **Admins** to oversee platform governance.

---

## ✨ Features

### 🔒 Authentication & Role-Based Access
- Secure JWT-based authentication with bcrypt password hashing.
- Self-registration for **Participants**, **Organizers**, and **Judges** (Admin accounts are protected and pre-configured).
- Persistent user sessions via `localStorage` with automatic role-based route protection on both frontend and backend.

### 👑 Admin Portal
- **Platform Analytics**: Real-time counters for total users, hackathons, teams, and project submissions.
- **User Governance**: Search and filter registered users by role; block/unblock accounts or delete users.
- **Content Moderation**: Overview of all platform hackathons with the capability to remove non-compliant events.

### 🎯 Organizer Portal
- **Hackathon Creation & Management**: Define title, description, theme, venue/online mode, dates, registration deadline, prize pool, rules, and judging criteria.
- **Registration Approval Workflow**: View registered teams and review applicant details with one-click **Approve** / **Reject** controls.
- **Submission Tracking**: Inspect team submissions including GitHub repos, live demo links, videos, and tech stacks.
- **Judge Assignment**: Use a fast, debounced **User Picker** to search registered judges by name/email and assign them to hackathons.

### 👥 Participant Portal
- **Hackathon Discovery**: Browse upcoming and active hackathons with client-side text search and Online/Offline filtering.
- **Team Management**: Form new teams for specific hackathons, invite members via user search, and monitor registration approval status.
- **Project Submission**: Submit project details including project name, problem statement, solution description, GitHub URL, live demo, video demo, presentation PDF, and tech stack tags.

### ⚖️ Judge Portal
- **Assigned Submissions Dashboard**: View hackathon submissions assigned specifically to the judge, with an interactive progress indicator.
- **Structured Scoring System**: Evaluate submissions across 7 criteria (10 points each, 70 max):
  - *Innovation*, *Technical Complexity*, *User Interface*, *Functionality*, *Scalability*, *Documentation*, and *Presentation*.
- **Feedback & Revisions**: Add optional textual feedback and update previously submitted evaluations at any time during the judging phase.

### 🏆 Public Leaderboard
- **Automated Ranking**: Real-time aggregated leaderboard ranking submissions by average score across all judge reviews.
- **Podium Display**: Highlight top-3 teams with custom podium styling and rank badges.
- **Review Count Transparency**: Shows total completed reviews per submission.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios (with global JWT request interceptor)
- **Styling**: Tailwind CSS (v4) — sleek Linear/Vercel-inspired dark theme

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Validation**: Mongoose Schema validation & Custom Middleware

### Dev Tools
- **Build Tool**: Vite
- **Process Manager**: Nodemon
- **Version Control**: Git & GitHub

---

## 📁 Project Structure

```
HeckNest/
├── backend/
│   ├── config/          # Database connection (db.js)
│   ├── controllers/     # Route business logic (auth, hackathon, team, registration, submission, review, leaderboard, user)
│   ├── middleware/      # Auth & role verification (authMiddleware.js)
│   ├── models/          # Mongoose models (User, Hackathon, Team, Registration, Submission, Review)
│   ├── routes/          # Express route definitions
│   ├── .env.example     # Environment variables template
│   └── server.js        # Server entry point
│
└── frontend/
    ├── public/          # Static assets & favicon
    ├── src/
    │   ├── components/  # Shared components (Navbar, UserPicker, ProtectedRoute)
    │   ├── context/     # AuthContext for global session management
    │   ├── layouts/     # Main page layouts
    │   ├── pages/       # Page components (Home, Login, Signup, HackathonListing, HackathonDetails, Leaderboard, Dashboards)
    │   ├── services/    # Axios API instance with JWT interceptor
    │   ├── App.jsx      # Route configuration & global Navbar
    │   ├── index.css    # Design tokens (@theme) & global resets
    │   └── main.jsx     # App mounting entry
    ├── index.html       # HTML document shell with Inter font
    └── vite.config.js   # Vite configuration
```

---

## 🚀 Getting Started & Setup

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) connection URI)

### 1. Clone the Repository
```bash
git clone https://github.com/Harshvardhan8091/HeckNest.git
cd HeckNest
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory (refer to `.env.example`):
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hecknest?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
```

Start the backend server:
```bash
npm run dev
```
The backend API server will start on `http://localhost:5000`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will launch at `http://localhost:5173`.

---

## 👥 User Roles Explained

| Role | Permissions & Boundaries |
|---|---|
| **Admin** | Full system governance. Can manage all registered users (block/delete) and delete non-compliant hackathons. |
| **Organizer** | Can create, update, and manage hackathons. Can approve/reject team registrations and assign judges. |
| **Participant** | Can browse hackathons, create/join teams, and submit project entries with repos, links, and media. |
| **Judge** | Can evaluate assigned submissions across 7 criteria and provide written feedback. |

---

## 📖 API Documentation

For the complete list of endpoints, request formats, authorization headers, and response payloads, please refer to the detailed [API Documentation](./API_DOCUMENTATION.md).

---

## ⚠️ Known Limitations & Future Roadmap

- **User Search vs. Email Invites**: Team member additions and judge assignments currently use an in-app search picker rather than email invite tokens.
- **URL-Based Media Assets**: Banner images, demo videos, and PDF presentations accept direct HTTPS links rather than raw cloud file uploads (e.g. AWS S3 / Cloudinary integration).
- **Real-Time Notifications**: Updates currently rely on standard HTTP requests rather than WebSocket/Socket.io real-time push events or automated transactional emails.

---

## ✍️ Author

- **Harshvardhan Tanwar**
- **GitHub**: [@Harshvardhan8091](https://github.com/Harshvardhan8091)
- **Repository**: [HeckNest on GitHub](https://github.com/Harshvardhan8091/HeckNest)
