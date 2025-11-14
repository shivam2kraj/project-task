# Task Manager

Full-stack task manager featuring authentication, role-based access control, and task CRUD with pagination.

## Features

- Sign up & sign in flows with JWT authentication.
- Admin and normal user roles.
- Dashboard with paginated task list and role-aware actions.
- Add/Edit task form with status management.
- Admin-only task deletion.
- REST API powered by Node.js/Express with MySQL (XAMPP) storage.

## Tech Stack

- Frontend: React 19, Vite, Material UI, Axios, React Router.
- Backend: Node.js, Express, MySQL (via `mysql2`), JWT, bcrypt.

## Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- XAMPP (or any MySQL server)

### Backend Setup

1. Copy `server/env.example` to `server/.env` and update the values:

   ```
   PORT=5000
   CLIENT_ORIGIN=http://localhost:5173

   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=task_manager

   JWT_SECRET=replace-with-secure-secret
   JWT_EXPIRES_IN=12h
   ```

2. Install dependencies and start the API:

   ```bash
   npm install
   npm --prefix server install
   npm run server:dev
   ```

   The server automatically initializes the required tables if they do not exist.

### Frontend Setup

1. Create a `.env` file in the project root with the API base URL:

   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. Install dependencies (if you haven't already) and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

3. Visit `http://localhost:5173`.

## API Overview

| Method | Endpoint            | Description                      | Auth |
| ------ | ------------------- | -------------------------------- | ---- |
| POST   | `/api/auth/signup`  | Create a new user                | No   |
| POST   | `/api/auth/signin`  | Authenticate and receive a token | No   |
| GET    | `/api/auth/me`      | Fetch current user profile       | Yes  |
| GET    | `/api/tasks`        | List tasks with pagination       | Yes  |
| GET    | `/api/tasks/:id`    | Fetch task detail                | Yes  |
| POST   | `/api/tasks`        | Create task                      | Yes  |
| PUT    | `/api/tasks/:id`    | Update task (owner/Admin)        | Yes  |
| DELETE | `/api/tasks/:id`    | Delete task (Admin only)         | Yes  |

## Troubleshooting

- Ensure the backend and frontend `.env` files are configured before running.
- Check MySQL credentials and confirm the database exists (it will be created automatically if the user has permissions).
- If CORS errors occur, verify `CLIENT_ORIGIN` matches the frontend URL.
