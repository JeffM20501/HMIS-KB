# HMIS Knowledge Base application Backend – API Documentation & Setup

## Table of contents

---

## Tech Stack

| Category       | Technology                          |
|----------------|-------------------------------------|
| Language       | Python 3.14.6                          |
| Framework      | Django                           |
| Database       | PostgreSQL (production), SQLite (test) |
| Authentication | JWT                         |
| Password Hashing| Django's PBKDF2 algorithm with a SHA-256 hash                       |
| Email Service  | Brevo (Sendinblue)                  |
| File Uploads   | Cloudinary                          |
| Testing        | Pytest, Faker                       |
| CI/CD          | GitHub Actions                      |
| Deployment     | Render                              |

---

## Pre-requisites

- Python 3.14.6
- PostgreSQL(local or remote)
- pip and vitual enviroment (recommended `pip`). Optional `pipenv`

---

## Enviroment Variables

- Create a `.env` file inthe project root with the follwing variables


| Variable                    | Description                                   | Example                                                    |
|-----------------------------|-----------------------------------------------|------------------------------------------------------------|
| `SECRET_KEY`                | Flask secret key (used for JWT)              | `your-very-long-secret-key-32chars+`                       |
| `DATABASES`              | PostgreSQL connection configaration                 | `postgresql://user:pass@localhost:5432/ireporter_db`       |
| `BREVO_API_KEY`             | Brevo API key for email                      | `xkeysib-...`                                              |
| `MAIL_DEFAULT_SENDER`       | Verified sender email address                | `noreply@ireporter.com`                                    |
| `CLOUDINARY_CLOUD_NAME`     | Cloudinary cloud name                        | `your_cloud_name`                                          |
| `CLOUDINARY_API_KEY`        | Cloudinary API key                           | `123456789`                                                |
| `CLOUDINARY_API_SECRET`     | Cloudinary API secret                        | `abcdefg`                                                  |


## API Contracts (RESTful Endpoints)

>Development
**Base URL:** `http://localhost:8000/api/v1`  
**Version:** v1

>Production
**Base URL:** `https://your-url/api/v1`  
**Version:** v1

### Standard Headers

All endpoints (except `/auth/login` and `/auth/register`) require a Bearer Token for authentication.

| Header | Value | Required |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | Always |
| `Authorization` | `Bearer <your_jwt_token>` | Authenticated Routes |

---

### 1. Authentication & User Management

*Handles Login, Registration, and Role-Based Access Control (RBAC).*

| Method | Endpoint | Description | Access | Request Body (JSON) | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/auth/login` | Authenticate user and return JWT token | Public | `{ "email": "user@hms.com", "password": "yourpassword" }` | `{ "token": "jwt...", "user": { "id": 1, "username": "...", "role": "admin" } }` |
| **POST** | `/auth/register` | Create a new user account | Admin Only | `{ "username": "jdoe", "email": "jdoe@hms.com", "password": "...", "role": "viewer" }` | `{ "message": "User created successfully", "user": { "id": 2, ... } }` |
| **GET** | `/auth/profile` | Fetch the currently authenticated user | Authenticated | *(empty)* | `{ "id": 1, "username": "...", "email": "...", "role": "admin", "department": "IT" }` |
| **GET** | `/admin/users` | List all registered users (Admin panel) | Admin Only | *(empty)* | `{ "users": [ { "id": 1, "username": "...", "role": "editor" }, ... ] }` |
| **PUT** | `/admin/users/:id/role` | Update a user's role | Admin Only | `{ "role": "editor" }` | `{ "message": "User role updated successfully" }` |

---

### 2. Articles (Core Knowledge Base)

*CRUD operations for managing documentation, SOPs, and guides.*

| Method | Endpoint | Description | Access | Request Body / Params | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/articles` | Retrieve all **published** articles with pagination & filters | Viewer+ | **Query:** `?page=1&limit=20&category=2&tag=emergency` | `{ "articles": [ { "id": 5, "title": "...", "slug": "...", "category": {...} } ], "total": 50, "page": 1 }` |
| **GET** | `/articles/:slug` | Fetch a single article by its SEO slug | Viewer+ | *(empty)* | `{ "article": { "id": 5, "title": "How to Reset Password", "content": "...", "views": 120, "category_id": 3 } }` |
| **POST** | `/articles` | Create a new draft article | Editor+ | `{ "title": "...", "content": "...", "category_id": 2, "tag_ids": [1, 3] }` | `{ "message": "Draft saved successfully", "article": { "id": 6, "status": "draft" } }` |
| **PUT** | `/articles/:id` | Update an existing article | Editor+ (Author) / Admin | `{ "title": "...", "content": "...", "category_id": 4 }` | `{ "message": "Article updated", "article": { ... } }` |
| **PATCH** | `/articles/:id/publish` | Submit for review or publish immediately | Admin Only | `{ "status": "published" }` | `{ "message": "Article published", "published_at": "2026-07-01T10:00:00Z" }` |
| **DELETE** | `/articles/:id` | Soft-delete (archive) an article | Admin Only | *(empty)* | `{ "message": "Article archived successfully" }` |

---

### 3. 🔍 Search Engine (P0 Feature)

*Optimized, ranked full-text search for healthcare workers.*

| Method | Endpoint | Description | Access | Request Params | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/search` | Full-text search across titles, content, and tags | Viewer+ | **Query:** `?q=patient+registration&category=3&sort=relevance` | `{ "results": [ { "id": 2, "title": "...", "snippet": "...", "category": "Patient Mgmt" } ], "total": 12, "query": "patient registration" }` |

---

### 4. Categories & Tags (Filtering & Taxonomy)

| Method | Endpoint | Description | Access | Request Body / Params | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/categories` | List all categories (supports nested structure) | Viewer+ | *(empty)* | `{ "categories": [ { "id": 1, "name": "Clinical Modules", "children": [ { "id": 3, "name": "Lab" } ] } ] }` |
| **POST** | `/categories` | Create a new category | Admin Only | `{ "name": "Radiology", "parent_id": null }` | `{ "message": "Category created", "category": { "id": 7 } }` |
| **GET** | `/tags` | Fetch all available tags | Viewer+ | *(empty)* | `{ "tags": [ { "id": 1, "name": "Emergency" }, { "id": 2, "name": "SOP" } ] }` |

---

### 5.  Chatbot Widget (The Embedded Assistant)

*Handles natural language queries from the HMIS widget. **This endpoint must bypass CORS restrictions.***

| Method | Endpoint | Description | Access | Request Body (JSON) | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/chat` | Send a question to the Knowledge Bot | Viewer+ | `{ "question": "How do I reverse a discharge?", "conversation_id": "uuid-123" }` | `{ "answer": "To reverse a discharge, navigate to Patient Management...", "article_ref": { "id": 45, "title": "Discharge Reversal SOP", "slug": "..." }, "grounded": true }` |

---

### 6.  Feedback & Analytics (User Engagement)

| Method | Endpoint | Description | Access | Request Body (JSON) | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/feedback` | Submit a rating/comment on an article | Viewer+ | `{ "article_id": 5, "rating": 4, "comment": "Very clear guide." }` | `{ "message": "Thank you for your feedback!" }` |
| **POST** | `/chat/:log_id/feedback` | Mark chatbot answer as helpful/unhelpful | Viewer+ | `{ "was_helpful": true }` | `{ "message": "Feedback recorded" }` |
| **GET** | `/admin/dashboard/stats` | Retrieve system KPIs for Admin dashboard | Admin Only | *(empty)* | `{ "total_articles": 50, "avg_rating": 4.2, "top_searches": ["password reset", "billing"] }` |
| **GET** | `/admin/chat-logs` | Fetch unanswered questions to identify content gaps (FR-5.9) | Admin Only | *(empty)* | `{ "unanswered_queries": [ "How to fix lab error 404?" ], "total": 3 }` |

---

### 7.  Media Uploads (For Screenshots & Attachments)

| Method | Endpoint | Description | Access | Request Body | Successful Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **POST** | `/media/upload` | Upload an image/PDF for an article | Editor+ | **Form-Data:** `file: (binary)`, `article_id: 5` | `{ "url": "https://cdn.kb.com/media/image.png", "filename": "screenshot.png" }` |

---

### Role-Based Access Control (RBAC) Matrix

| Endpoint Group | Viewer (Nurse) | Editor (Author) | Admin (Manager) |
| :--- | :--- | :--- | :--- |
| `/auth/login`, `/auth/register` | Yes | Yes | Yes |
| `GET /articles`, `GET /articles/:slug` | Yes | Yes | Yes |
| `POST /articles` (Create) |  No | Yes | Yes |
| `PUT /articles/:id` (Update) |  No | Only their own drafts | Yes (All articles) |
| `PATCH /articles/:id/publish` |  No |  No | Yes |
| `DELETE /articles/:id` |  No |  No | Yes |
| `GET /search` | Yes | Yes | Yes |
| `POST /chat` | Yes | Yes | Yes |
| `POST /feedback` | Yes | Yes | Yes |
| `GET /admin/*` |  No |  No | Yes |

---

### CORS Configuration (Crucial for the HMIS Widget)

To allow the chatbot widget to function inside the external HMIS mockup, the backend must be configured with the following CORS settings:

| Setting | Value |
| :--- | :--- |
| `Allowed Origins` | `["https://hmis-mockup.com", "http://localhost:3001"]` *(Adjust for dev/prod)* |
| `Allowed Methods` | `GET, POST, PUT, DELETE, OPTIONS` |
| `Allowed Headers` | `Content-Type, Authorization` |
| `Exposed Headers` | `Authorization` |
| `Credentials` | `true` (if using cookies/sessions) |

---

**Postman Collection:**  
A complete Postman collection for these endpoints is available in the `/postman` directory of this repository. Import it to test the API locally.

---

# API Contracts - Healthcare Knowledge Base System

**Version:** v1  
**Local** --> ***Base URL*** `http:..localhost:5020/api/v1`
**Production** --> ***Base URL*** `https://your-backend.onrender.com/api/v1`
**Content-Type:** `application/json` (unless specified otherwise)

---

## Standard Headers

| Header | Value | Required For |
| :--- | :--- | :--- |
| `Content-Type` | `application/json` | All requests with a body |
| `Authorization` | `Bearer <your_jwt_token>` | All authenticated routes (except `/auth/login`) |

---

## 1. Authentication & User Management

### `POST /auth/login`

Login and receive a JWT access token.

**Request Body:**

```json
{
  "email": "nurse@hospital.com",
  "password": "securepassword123"
}

