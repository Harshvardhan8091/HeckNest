# HeckNest Backend API Documentation

> Complete reference for all REST API endpoints provided by the HeckNest backend server.

---

> [!IMPORTANT]
> **Authentication Requirement**: All protected routes require an HTTP Authorization header in the following format:
> `Authorization: Bearer <JWT_TOKEN>`

---

## Table of Contents
1. [Authentication (`/api/auth`)](#1-authentication-apiauth)
2. [Hackathons (`/api/hackathons`)](#2-hackathons-apihackathons)
3. [Teams (`/api/teams`)](#3-teams-apiteams)
4. [Registrations (`/api/registrations`)](#4-registrations-apiregistrations)
5. [Submissions (`/api/submissions`)](#5-submissions-apisubmissions)
6. [Reviews (`/api/reviews`)](#6-reviews-apireviews)
7. [Leaderboard (`/api/leaderboard`)](#7-leaderboard-apileaderboard)
8. [Users (`/api/users`)](#8-users-apiusers)

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user account (participant, organizer, or judge).

- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "secretpassword",
    "role": "participant"
  }
  ```
  *(Role defaults to `"participant"` if omitted. Valid roles: `participant`, `organizer`, `judge`)*

- **Success Response** (`201 Created`):
  ```json
  {
    "_id": "678e123456789abcdef01234",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "participant",
    "isBlocked": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Name, email and password are required" }` or `{ "message": "User already exists" }`
  - `500 Internal Server Error`: `{ "message": "Server error" }`

---

### `POST /api/auth/login`
Authenticates a user and returns a JWT token.

- **Access Level**: Public
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "secretpassword"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "_id": "678e123456789abcdef01234",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "participant",
    "isBlocked": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6Ik..."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Email and password are required" }`
  - `401 Unauthorized`: `{ "message": "Invalid credentials" }`
  - `403 Forbidden`: `{ "message": "User is blocked" }`
  - `500 Internal Server Error`: `{ "message": "Server error" }`

---

### `GET /api/auth/me`
Fetches current authenticated user details.

- **Access Level**: Private (Any logged-in user)
- **Request Headers**: `Authorization: Bearer <JWT_TOKEN>`
- **Success Response** (`200 OK`):
  ```json
  {
    "_id": "678e123456789abcdef01234",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "participant",
    "isBlocked": false,
    "createdAt": "2026-07-21T08:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: `{ "message": "Not authorized, no token" }` or `{ "message": "Not authorized, token failed" }`

---

## 2. Hackathons (`/api/hackathons`)

### `GET /api/hackathons`
Retrieves all hackathons with optional search and filter parameters.

- **Access Level**: Public
- **Query Parameters**:
  - `search` (optional): Filter title by case-insensitive substring
  - `mode` (optional): Filter by `"online"` or `"offline"`
  - `status` (optional): Filter by `"upcoming"`, `"ongoing"`, or `"completed"`
- **Success Response** (`200 OK`):
  ```json
  [
    {
      "_id": "678e11112222333344445555",
      "title": "AI Innovation Sprint 2026",
      "description": "Build cutting-edge generative AI models.",
      "theme": "AI & ML",
      "mode": "online",
      "startDate": "2026-08-01T00:00:00.000Z",
      "endDate": "2026-08-03T00:00:00.000Z",
      "registrationDeadline": "2026-07-30T00:00:00.000Z",
      "prizePool": "$10,000",
      "maxTeamSize": 4,
      "status": "upcoming",
      "organizer": {
        "_id": "678e99998888777766665555",
        "name": "Tech Corp",
        "email": "org@techcorp.com"
      }
    }
  ]
  ```

---

### `POST /api/hackathons`
Creates a new hackathon.

- **Access Level**: Private (`organizer` or `admin` only)
- **Request Body**:
  ```json
  {
    "title": "AI Innovation Sprint 2026",
    "description": "Build cutting-edge generative AI models.",
    "theme": "AI & ML",
    "mode": "online",
    "startDate": "2026-08-01",
    "endDate": "2026-08-03",
    "registrationDeadline": "2026-07-30",
    "prizePool": "$10,000",
    "maxTeamSize": 4,
    "rules": "Original work only.",
    "judgingCriteria": ["Innovation", "User Experience", "Functionality"]
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "_id": "678e11112222333344445555",
    "title": "AI Innovation Sprint 2026",
    "organizer": "678e99998888777766665555",
    "status": "upcoming",
    "createdAt": "2026-07-21T08:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Token missing or invalid
  - `403 Forbidden`: User does not have `organizer` or `admin` role

---

### `GET /api/hackathons/:id`
Retrieves a specific hackathon by ID.

- **Access Level**: Public
- **Success Response** (`200 OK`): Hackathon object with populated organizer details.
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Invalid ID format" }`
  - `404 Not Found`: `{ "message": "Hackathon not found" }`

---

### `PUT /api/hackathons/:id`
Updates hackathon details.

- **Access Level**: Private (Hackathon creating `organizer` or `admin`)
- **Request Body**: JSON object containing fields to update.
- **Success Response** (`200 OK`): Updated hackathon object.
- **Error Responses**:
  - `403 Forbidden`: `{ "message": "Forbidden, not authorized to update this hackathon" }`
  - `404 Not Found`: `{ "message": "Hackathon not found" }`

---

### `DELETE /api/hackathons/:id`
Deletes a hackathon.

- **Access Level**: Private (Hackathon creating `organizer` or `admin`)
- **Success Response** (`200 OK`): `{ "message": "Hackathon deleted successfully" }`
- **Error Responses**:
  - `403 Forbidden`: `{ "message": "Forbidden, not authorized to delete this hackathon" }`
  - `404 Not Found`: `{ "message": "Hackathon not found" }`

---

## 3. Teams (`/api/teams`)

### `POST /api/teams`
Creates a team for a hackathon. The creating user automatically becomes the team leader and first member.

- **Access Level**: Private
- **Request Body**:
  ```json
  {
    "name": "Neural Ninjas",
    "hackathon": "678e11112222333344445555"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "_id": "678e44445555666677778888",
    "name": "Neural Ninjas",
    "hackathon": "678e11112222333344445555",
    "leader": "678e123456789abcdef01234",
    "members": ["678e123456789abcdef01234"]
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "name and hackathon are required" }`
  - `409 Conflict`: `{ "message": "You already belong to a team for this hackathon" }`

---

### `GET /api/teams/my`
Retrieves all teams the current user is a member of or leads.

- **Access Level**: Private
- **Success Response** (`200 OK`): Array of populated team objects (includes hackathon title, leader & member details).

---

### `GET /api/teams/:id`
Retrieves details of a specific team by ID.

- **Access Level**: Private
- **Success Response** (`200 OK`): Populated team object.
- **Error Responses**:
  - `404 Not Found`: `{ "message": "Team not found" }`

---

### `POST /api/teams/:id/members`
Adds a user to a team.

- **Access Level**: Private (Team Leader only)
- **Request Body**:
  ```json
  {
    "userId": "678e99998888777766660000"
  }
  ```
- **Success Response** (`200 OK`): Updated team object.
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Team is full. Maximum team size is 4" }`
  - `403 Forbidden`: `{ "message": "Only the team leader can add members" }`
  - `409 Conflict`: `{ "message": "User is already a member of this team" }`

---

### `DELETE /api/teams/:id/members/:userId`
Removes a member from a team.

- **Access Level**: Private (Team Leader only; leader cannot remove self)
- **Success Response** (`200 OK`): `{ "message": "Member removed successfully", "team": { ... } }`
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Leader cannot remove themselves this way. Use leaveTeam or transferLeadership." }`
  - `403 Forbidden`: `{ "message": "Only the team leader can remove members" }`

---

### `POST /api/teams/:id/leave`
Allows a member to leave a team. If the leader leaves and is the sole member, the team is deleted; if other members remain, leadership must be transferred first.

- **Access Level**: Private
- **Success Response** (`200 OK`): `{ "message": "You have left the team" }` or `{ "message": "Team disbanded and deleted successfully" }`
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "You are the leader. Transfer leadership to another member before leaving." }`

---

### `PUT /api/teams/:id/transfer-leadership`
Transfers team leadership to another team member.

- **Access Level**: Private (Team Leader only)
- **Request Body**:
  ```json
  {
    "newLeaderId": "678e99998888777766660000"
  }
  ```
- **Success Response** (`200 OK`): `{ "message": "Leadership transferred successfully", "team": { ... } }`

---

### `DELETE /api/teams/:id`
Deletes a team.

- **Access Level**: Private (Team Leader only)
- **Success Response** (`200 OK`): `{ "message": "Team deleted successfully" }`

---

## 4. Registrations (`/api/registrations`)

### `POST /api/registrations`
Registers a team for a hackathon.

- **Access Level**: Private (Team Leader only)
- **Request Body**:
  ```json
  {
    "teamId": "678e44445555666677778888",
    "hackathonId": "678e11112222333344445555"
  }
  ```
- **Success Response** (`201 Created`):
  ```json
  {
    "_id": "678eregg111222333",
    "team": "678e44445555666677778888",
    "hackathon": "678e11112222333344445555",
    "status": "pending",
    "createdAt": "2026-07-21T09:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "Registration deadline has passed for this hackathon" }`
  - `403 Forbidden`: `{ "message": "Only the team leader can register the team for a hackathon" }`
  - `409 Conflict`: `{ "message": "This team is already registered for this hackathon" }`

---

### `GET /api/registrations/my`
Gets hackathon registrations for all teams the requesting user belongs to.

- **Access Level**: Private
- **Success Response** (`200 OK`): Array of populated registration objects.

---

### `GET /api/registrations/hackathon/:hackathonId`
Gets all team registrations for a specific hackathon.

- **Access Level**: Private (Hackathon `organizer` or `admin` only)
- **Success Response** (`200 OK`): Array of team registrations with populated member information.
- **Error Responses**:
  - `403 Forbidden`: `{ "message": "Forbidden, only the hackathon organizer or admin can view registrations" }`

---

### `PUT /api/registrations/:id/status`
Updates registration status (`approved` or `rejected`).

- **Access Level**: Private (Hackathon `organizer` or `admin` only)
- **Request Body**:
  ```json
  {
    "status": "approved"
  }
  ```
- **Success Response** (`200 OK`): Updated registration object.
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "status must be one of: approved, rejected" }`

---

## 5. Submissions (`/api/submissions`)

### `POST /api/submissions`
Submits a project for an approved team registration.

- **Access Level**: Private (Team Leader only; team registration status must be `approved`)
- **Request Body**:
  ```json
  {
    "team": "678e44445555666677778888",
    "hackathon": "678e11112222333344445555",
    "projectName": "VisionAI Platform",
    "problemStatement": "Detecting anomalies in video feeds.",
    "solutionDescription": "Real-time edge computing ML pipeline.",
    "githubRepo": "https://github.com/myteam/vision-ai",
    "liveDemoUrl": "https://visionai.demo.com",
    "demoVideoLink": "https://youtube.com/watch?v=12345",
    "presentationPdf": "https://visionai.demo.com/deck.pdf",
    "techStack": ["React", "Python", "TensorFlow", "FastAPI"]
  }
  ```
- **Success Response** (`201 Created`): Created submission object with status `"pending"`.
- **Error Responses**:
  - `403 Forbidden`: `{ "message": "Team must have an approved registration for this hackathon before submitting" }`
  - `409 Conflict`: `{ "message": "This team has already submitted a project for this hackathon" }`

---

### `GET /api/submissions/my`
Gets project submissions for all teams the current user belongs to.

- **Access Level**: Private
- **Success Response** (`200 OK`): Array of populated submission objects.

---

### `GET /api/submissions/hackathon/:hackathonId`
Gets all submissions for a hackathon with optional `status` filter query.

- **Access Level**: Private (Hackathon `organizer` or `admin` only)
- **Query Parameters**: `status` (optional: `pending`, `under_review`, `approved`, `rejected`)
- **Success Response** (`200 OK`): Array of submission objects.

---

### `GET /api/submissions/:id`
Gets single submission details by ID.

- **Access Level**: Private
- **Success Response** (`200 OK`): Populated submission object.

---

### `PUT /api/submissions/:id`
Updates an existing project submission (before hackathon `endDate`).

- **Access Level**: Private (Team Leader only)
- **Request Body**: JSON object containing editable fields (`projectName`, `githubRepo`, `techStack`, etc.)
- **Success Response** (`200 OK`): Updated submission object.
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "The hackathon has ended. Submissions can no longer be edited." }`

---

### `PUT /api/submissions/:id/status`
Updates submission evaluation status (`under_review`, `approved`, `rejected`).

- **Access Level**: Private (Hackathon `organizer` or `admin` only)
- **Request Body**: `{ "status": "under_review" }`
- **Success Response** (`200 OK`): Updated submission object.

---

## 6. Reviews (`/api/reviews`)

### `POST /api/reviews/assign`
Assigns a judge to a hackathon.

- **Access Level**: Private (`organizer` or `admin` only)
- **Request Body**:
  ```json
  {
    "judgeId": "678e99998888777766660000",
    "hackathonId": "678e11112222333344445555"
  }
  ```
- **Success Response** (`200 OK`): `{ "message": "Judge \"John Judge\" successfully assigned to hackathon \"AI Sprint\"" }`
- **Error Responses**:
  - `400 Bad Request`: `{ "message": "User does not have the \"judge\" role" }`
  - `409 Conflict`: `{ "message": "Judge is already assigned to this hackathon" }`

---

### `GET /api/reviews/assigned`
Retrieves all submissions assigned to the requesting judge across their hackathons, annotated with `reviewedByMe: boolean`.

- **Access Level**: Private (`judge` role only)
- **Success Response** (`200 OK`): Array of annotated submission objects.

---

### `POST /api/reviews`
Submits a numerical score review for a project submission across 7 criteria (max 10 points each).

- **Access Level**: Private (`judge` assigned to the hackathon, or `admin`)
- **Request Body**:
  ```json
  {
    "submissionId": "678esub111222333",
    "scores": {
      "innovation": 9,
      "technicalComplexity": 8,
      "userInterface": 9,
      "functionality": 10,
      "scalability": 8,
      "documentation": 7,
      "presentation": 9
    },
    "comments": "Outstanding execution and clean architecture."
  }
  ```
- **Success Response** (`201 Created`): Review object including computed `totalScore: 60`.
- **Error Responses**:
  - `403 Forbidden`: `{ "message": "You are not assigned as a judge for this hackathon" }`
  - `409 Conflict`: `{ "message": "You have already submitted a review for this submission" }`

---

### `PUT /api/reviews/:id`
Updates an existing review (allowed up to 3 days after hackathon `endDate`).

- **Access Level**: Private (Authoring `judge` only)
- **Request Body**: JSON object with updated `scores` or `comments`.
- **Success Response** (`200 OK`): Updated review object.

---

### `GET /api/reviews/submission/:submissionId`
Fetches reviews for a submission. Organizers/admins see all reviews; judges see only their own review.

- **Access Level**: Private (`organizer`, `admin`, or authoring `judge`)
- **Success Response** (`200 OK`): Array of review objects with populated judge details.

---

## 7. Leaderboard (`/api/leaderboard`)

### `GET /api/leaderboard/:hackathonId`
Generates the real-time leaderboard for a hackathon, sorted by average total judge score descending (with alphabetical tie-breaking).

- **Access Level**: Public
- **Success Response** (`200 OK`):
  ```json
  {
    "hackathon": "AI Innovation Sprint 2026",
    "hackathonId": "678e11112222333344445555",
    "leaderboard": [
      {
        "rank": 1,
        "submissionId": "678esub111222333",
        "projectName": "VisionAI Platform",
        "teamName": "Neural Ninjas",
        "averageScore": 64.5,
        "reviewCount": 2,
        "submissionStatus": "under_review"
      },
      {
        "rank": 2,
        "submissionId": "678esub444555666",
        "projectName": "DataPulse",
        "teamName": "Byte Crafters",
        "averageScore": 58.0,
        "reviewCount": 1,
        "submissionStatus": "pending"
      }
    ]
  }
  ```

---

## 8. Users (`/api/users`)

### `GET /api/users/search?search=<term>&role=<role>`
Searches registered users by name or email (limit 10). Used by team leader & organizer search pickers.

- **Access Level**: Private (Any authenticated user)
- **Query Parameters**:
  - `search` (optional): Name/email substring match
  - `role` (optional): Filter by role (`participant`, `organizer`, `judge`, `admin`)
- **Success Response** (`200 OK`): Array of concise user objects (`_id`, `name`, `email`, `role`).

---

### `GET /api/users/stats`
Gets platform-wide counters (total users, hackathons, teams, submissions).

- **Access Level**: Private (`admin` only)
- **Success Response** (`200 OK`):
  ```json
  {
    "totalUsers": 42,
    "totalHackathons": 8,
    "totalTeams": 18,
    "totalSubmissions": 12
  }
  ```

---

### `GET /api/users?role=<role>`
Gets list of all registered users with optional role filter.

- **Access Level**: Private (`admin` only)
- **Success Response** (`200 OK`): Array of user objects (`_id`, `name`, `email`, `role`, `isBlocked`, `createdAt`).

---

### `PUT /api/users/:id/block`
Toggles `isBlocked` status on a user account.

- **Access Level**: Private (`admin` only; admins cannot block themselves)
- **Success Response** (`200 OK`): `{ "message": "User \"Jane Doe\" has been blocked", "user": { ... } }`

---

### `DELETE /api/users/:id`
Deletes a user account.

- **Access Level**: Private (`admin` only; admins cannot delete themselves)
- **Success Response** (`200 OK`): `{ "message": "User \"Jane Doe\" deleted successfully" }`
