# RISSE

A decoupled web application built with **Vue 3** (frontend) and **Laravel** (backend),
connected to a **MySQL** database provided by XAMPP.

---

## Project Structure

```
RISSE/
├── frontend/    — Vue 3 + Vite application
├── backend/     — Laravel REST API
├── .gitignore
└── README.md
```

---

## Prerequisites

| Tool        | Version used     | Notes                          |
|-------------|------------------|--------------------------------|
| Node.js     | v26+             | https://nodejs.org             |
| npm         | 11+              | Included with Node             |
| PHP         | 8.4+             | Homebrew or XAMPP              |
| Composer    | 2.x              | https://getcomposer.org        |
| XAMPP       | Latest           | For MySQL/MariaDB locally      |

---

## 1. Database Setup (XAMPP)

1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **MySQL**.
3. Click **Admin** (or open `http://localhost/phpmyadmin`).
4. In phpMyAdmin, click **New** in the left sidebar.
5. Name the database **`risse_db`**, choose `utf8mb4_unicode_ci`, and click **Create**.

---

## 2. Backend Setup

```bash
cd backend

# Copy environment file and edit it
cp .env.example .env
# (Set DB_DATABASE, DB_USERNAME, DB_PASSWORD to match your XAMPP settings)

# Generate application key (already done on install — run if .env is fresh)
php artisan key:generate

# Run database migrations
php artisan migrate

# Start the development server
php artisan serve
```

Backend available at: **http://127.0.0.1:8000**

Health-check endpoint: `GET http://127.0.0.1:8000/api/health`

---

## 3. Frontend Setup

```bash
cd frontend

# Copy environment file (edit if needed)
cp .env.example .env

# Install dependencies
npm install

# Start the development server
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## 4. Running Both Simultaneously

Open two terminal windows:

**Terminal 1 — Backend**
```bash
cd backend && php artisan serve
```

**Terminal 2 — Frontend**
```bash
cd frontend && npm run dev
```

---

## 5. Local Development URLs

| Service      | URL                              |
|--------------|----------------------------------|
| Frontend     | http://localhost:5173            |
| Backend API  | http://127.0.0.1:8000/api        |
| Health check | http://127.0.0.1:8000/api/health |
| phpMyAdmin   | http://localhost/phpmyadmin      |

---

## 6. Environment Variables

### `frontend/.env`
| Variable           | Description                      | Default                          |
|--------------------|----------------------------------|----------------------------------|
| `VITE_APP_NAME`    | Application name (page title)    | `RISSE`                          |
| `VITE_API_BASE_URL`| Laravel API base URL             | `http://127.0.0.1:8000/api`      |

> **Never put secrets or database credentials in `VITE_` variables.**
> They are embedded in the built JavaScript and visible to anyone.

### `backend/.env`
| Variable       | Description                |
|----------------|----------------------------|
| `APP_KEY`      | Laravel encryption key     |
| `DB_HOST`      | MySQL host (127.0.0.1)     |
| `DB_PORT`      | MySQL port (3306)          |
| `DB_DATABASE`  | Database name (`risse_db`) |
| `DB_USERNAME`  | MySQL user (`root`)        |
| `DB_PASSWORD`  | MySQL password (empty for default XAMPP) |

---

## 7. Technology Stack

**Frontend**
- Vue 3 + Vite — fast component-based UI framework
- Vue Router 4 — client-side navigation
- Pinia — state management
- Axios — HTTP client for API requests
- @lucide/vue — icon library

**Backend**
- Laravel 13 — PHP REST API framework
- Laravel Sanctum — future API authentication
- Eloquent ORM — database models and queries

**Database / Dev Tools**
- MySQL/MariaDB via XAMPP
- phpMyAdmin — database management UI

---

## 8. Code Structure — Frontend

```
frontend/src/
├── assets/          Static assets (images, fonts)
├── components/
│   ├── ui/          Reusable UI elements (Button, Card, Badge)
│   ├── layout/      Page-level layout blocks
│   └── navigation/  Header, Footer, nav menus
├── layouts/         Full-page layout wrappers
├── router/          Route definitions
├── stores/          Pinia state stores
├── services/        Axios instance + API service modules
├── views/           Routed page components
├── composables/     Reusable Composition API logic
└── styles/          Global CSS variables, reset, utilities
```

---

## 9. CORS

The backend is configured to accept API requests from `http://localhost:5173`
(the Vite dev server). See `backend/config/cors.php`.

When deploying to production, update `allowed_origins` to the real frontend domain.

---

## 10. Build for Production

**Frontend**
```bash
cd frontend && npm run build
```
Output goes to `frontend/dist/`. Deploy via any static host (Netlify, Vercel, S3, etc.).

**Backend**
Deploy `backend/` to a PHP server or service (Forge, Vapor, shared hosting, etc.)
and run `php artisan optimize` after deployment.
