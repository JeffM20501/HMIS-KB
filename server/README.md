# HMIS Knowledge Base Platform – Backend

A production‑ready Django REST API powering the TaifaCare Help Center.  
It manages articles, categories, products, user feedback, search analytics, and an AI‑powered chatbot with Retrieval‑Augmented Generation (RAG).

---

## Table of Contents

- [HMIS Knowledge Base Platform – Backend](#hmis-knowledge-base-platform--backend)
  - [Table of Contents](#table-of-contents)
- [Clone and install](#clone-and-install)
  - [Tech Stack](#tech-stack)
  - [Key Features](#key-features)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Setup \& Installation](#setup--installation)
  - [API Documentation](#api-documentation)
    - [Interactive API Docs (Swagger UI)](#interactive-api-docs-swagger-ui)
    - [Routes](#routes)
    - [Public Stats](#public-stats)
    - [CORS Configuration](#cors-configuration)
  - [Deployment](#deployment)
    - [Using Docker](#using-docker)
  - [Testing](#testing)
  - [Troubleshooting](#troubleshooting)

---

# Clone and install

```bash
git clone https://github.com/your-org/hmis-kb-backend.git
cd hmis-kb-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # and fill in values
python manage.py migrate
python manage.py runserver
```

- The API will be available at `http://localhost:8000/api/v1/`

---

## Tech Stack

| Category             | Technology |
|----------------------|------------|
| Language             | Python 3.14.6 |
| Framework            | Django 6.0.7, Django REST Framework |
| Database             | PostgreSQL (with pgvector for vector search) |
| Authentication       | JWT (via `djangorestframework-simplejwt`) |
| Email Service        | Brevo (Sendinblue) |
| File Storage         | Cloudinary |
| AI / Embeddings      | Fastembed (`BAAI/bge‑small‑en‑v1.5`), pgvector |
| LLM Provider         | Groq (Llama 3.3‑70B / Llama 3.1‑8B) |
| Testing              | Pytest |
| CI/CD                | GitHub Actions |
| Containerisation     | Docker |
| Deployment           | Render |

---

## Key Features

- **Article Management** – Full CRUD with draft/publish workflow, versioning, and SEO‑friendly slugs.
- **Categories, Tags & Products** – Organise content hierarchically; filter articles by product (e.g., SHA, NSSF).
- **Advanced Search** – Full‑text + vector similarity search (RAG) for accurate results.
- **Chatbot (RAG)** – Uses embeddings and pgvector to retrieve relevant articles and generate grounded answers via Groq.
- **Analytics** – Track article views, search logs, chat feedback, and user activity.
- **Notifications** – In‑app alerts for article submissions, publications, and rejections.
- **Audit Log** – Record every admin action (publish, reject, role change, etc.).
- **Media Uploads** – Attach images, PDFs, and videos to articles via Cloudinary.
- **Role‑Based Access** – Viewer, Editor, Admin with fine‑grained permissions.
- **CORS‑ready** – Configured to allow the chatbot widget to be embedded anywhere.

---

## Prerequisites

- Python 3.14.6
- PostgreSQL (local or remote) with the `pgvector` extension enabled
- Docker (optional, for containerised deployment)
- A Cloudinary account for media storage
- A Brevo account for transactional emails
- A Groq API key for the LLM

---

## Environment Variables

Create a `.env` file in the project root with the following keys:

| Variable | Description | Example |
| ---------- | ------------- | --------- |
| `SECRET_KEY` | Django secret key (keep secret!) | `django‑insecure‑…` |
| `DEBUG` | Set to `0` in production | `0` |
| `ALLOWED_HOSTS` | Comma‑separated list of allowed domains | `localhost,127.0.0.1,api.example.com` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/dbname` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefg` |
| `BREVO_SMTP_USER` | Brevo SMTP login (email) | `your@email.com` |
| `BREVO_SMTP_PASSWORD` | Brevo SMTP password | `xxxxxxx` |
| `EMAIL_HOST` | Brevo SMTP host | `smtp-relay.brevo.com` |
| `DEFAULT_FROM_EMAIL` | Sender email address | `noreply@example.com` |
| `GROQ_API_KEY` | Groq API key for LLM | `gsk_…` |
| `FRONTEND_URL` | Frontend origin (for CORS) | `https://helpcenter.example.com` |
| `SIGNING_KEY` | (Optional) JWT signing key – if not set, uses `SECRET_KEY` | `s3cr3t` |

---

## Setup & Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/hmis-kb-backend.git
   cd hmis-kb-backend
   ```

2. **Create and activate a virtual environment**

    ```bash
        python -m venv .venv
        source .venv/bin/activate      # Linux/M    ac
        .venv\Scripts\activate         # Windows    
    ```

3. **Install dependencies**

    ```bash
        pip install -r requirements.txt
    ```

4. **Set up environment variables** – copy `.env.example` to `.env` and fill in the values.

5. **Run migrations**

    ```bash
        python manage.py migrate
    ```

6. **Create a superuser (admin)**

    ```bash
        python manage.py createsuperuser
    ```

7. **Seed initial data (optional)**

    ```bash
        python manage.py loaddata initial_categories
    ```

8. **Run the development server**

    ```bash
        python manage.py runserver
    ```

- The API will be available at `http://localhost:8000/api/v1/`

## API Documentation

### Interactive API Docs (Swagger UI)

Once the server is running, visit the interactive OpenAPI explorer at:

- **Swagger UI:** [`http://localhost:8000/api/schema/swagger-ui/`](http://localhost:8000/api/schema/swagger-ui/)
- **ReDoc (alternative):** [`http://localhost:8000/api/schema/redoc/`](http://localhost:8000/api/schema/redoc/)

You can try out every endpoint directly from your browser — authentication is handled via the **"Authorize"** button (JWT Bearer token).

- All endpoints are prefixed with `/api/v1/`. Most endpoints require a valid **JWT** token in the Authorization: Bearer `<token>` header.

### Routes

**Authentication**

| Method | Endpoint | Description | Request Body | Response |
| --- | --- | --- | --- | --- |
| **POST** | /auth/token/ | Obtain access & refresh tokens | {*username*:*admin*,*password*:*123*} | {*access*:*...*,*refresh*:*...*} |
| **POST** | /auth/token/refresh/ | Refresh access token | {*refresh*:*...*} | {*access*:*...*} |
| **POST** | /auth/token/verify/ | Verify token | {*token*:*...*} | {} (**200** OK) |

**Users & Profile**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /u/users/me/ | Current user profile | Authenticated |
| **GET** | /u/users/dashboard/ | Editor dashboard stats | Editor+ |
| **GET** | /u/users/admin_dashboard/ | Admin dashboard KPIs | Admin |
| **GET** | /u/users/ | List all users | Admin |
| **PATCH** | /u/users/:id/change_role/ | Change user role | Admin |

**Articles**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /articles/ | List published articles (filterable) | Public |
| **GET** | /articles/:slug/ | Retrieve single article | Public (published only) |
| **POST** | /articles/ | Create draft | Editor+ |
| **PATCH** | /articles/:slug/ | Update article | Editor (own) / Admin |
| **DELETE** | /articles/:slug/ | Archive (soft‑delete) | Admin |
| **POST** | /articles/:slug/submit_for_review/ | Submit draft for admin review | Editor+ |
| **POST** | /articles/:slug/publish/ | Publish article | Admin |
| **POST** | /articles/:slug/reject/ | Reject article (with reason) | Admin |
| **GET** | /articles/my_articles/ | List current user’s articles | Authenticated |
| **GET** | /articles/pending_review/ | List pending articles | Admin |
| **GET** | /articles/creation_trend/ | Monthly creation vs publication trend | Admin |

**Categories**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /categories/ | List categories | Public |
| **GET** | /categories/root_categories/ | Root categories (no parent) | Public |
| **POST** | /categories/ | Create category | Admin |
| **PATCH** | /categories/:slug/ | Update category | Admin |
| **DELETE** | /categories/:slug/ | Delete category | Admin |

**Tags**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /tags/ | List tags | Public |
| **GET** | /tags/popular/ | Popular tags | Public |
| **POST** | /tags/ | Create tag | Admin |
| **DELETE** | /tags/:id/ | Delete tag | Admin |

**Products**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /products/ | List products | Authenticated |
| **GET** | /products/:slug/ | Retrieve product | Authenticated |
| **POST** | /products/ | Create product | Admin |
| **PATCH** | /products/:slug/ | Update product | Admin |
| **DELETE** | /products/:slug/ | Delete product | Admin |
| **GET** | /products/:slug/articles/ | List published articles for this product | Authenticated |

**Search**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /search/ | Full‑text + vector search | Public |
(Implemented via /articles/?search=...)

**Chatbot**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **POST** | /chat/ | Send a question to the **RAG** chatbot | Public |
| **GET** | /chat/conversations/ | List user conversations | Authenticated |
| **GET** | /chat/conversations/:id/messages/ | Get a conversation’s messages | Owner |
| **PATCH** | /chat/conversations/:id/rename/ | Rename conversation | Owner |
| **PATCH** | /chat/conversations/:id/archive/ | Archive conversation | Owner |
| **DELETE** | /chat/conversations/:id/ | Delete conversation | Owner |

**Analytics & Logs**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /analytics/feedbacks/ | List feedback | Admin |
| **POST** | /analytics/feedbacks/ | Submit feedback | Public |
| **GET** | /analytics/feedbacks/stats/ | Feedback statistics | Authenticated |
| **GET** | /analytics/search-logs/stats/ | Search statistics | Admin |
| **GET** | /analytics/chat-logs/stats/ | Chat statistics | Admin |
| **GET** | /analytics/time-series/ | Daily views & searches (for charts) | Admin |
| **GET** | /analytics/category-views/ | Views by category (percentage) | Admin |
| **GET** | /analytics/audit-logs/ | List audit log entries | Admin |
| **GET** | /analytics/notification/ | List user notifications | Authenticated |
| **PATCH** | /analytics/notification/:id/mark_read/ | Mark notification as read | Owner |
| **POST** | /analytics/notification/mark_all_read/ | Mark all notifications as read | Owner |

**Media**

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **POST** | /media/upload/ | Upload a file (image, **PDF**, video) | Editor+ |
| **GET** | /media/ | List media | Authenticated |
| **DELETE** | /media/:id/delete_file/ | Delete media file | Admin (or author) |

### Public Stats

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| **GET** | /stats/ | Public homepage stats (total articles, categories) | Public |
Role‑Based Access Control (**RBAC**)
| Action | Viewer | Editor | Admin |
| --- | --- | --- | --- |
| View published articles | ✅ | ✅ | ✅ |
| View draft/pending articles | ❌ | Only own | ✅ |
| Create article (draft) | ❌ | ✅ | ✅ |
| Edit own draft | ❌ | ✅ | ✅ |
| Edit others’ articles | ❌ | ❌ | ✅ |
| Submit for review | ❌ | ✅ | ✅ |
| Publish article | ❌ | ❌ | ✅ |
| Reject article | ❌ | ❌ | ✅ |
| Archive (delete) article | ❌ | ❌ | ✅ |
| Manage categories/tags | ❌ | ❌ | ✅ |
| Manage products | ❌ | ❌ | ✅ |
| View analytics dashboards | ❌ | Own stats | Full stats |
| View audit logs | ❌ | ❌ | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| Send chat messages | ✅ | ✅ | ✅ |

### CORS Configuration

- The backend is configured to allow cross‑origin requests from configured frontend origins.
In `settings.py`:

```python
    CORS_ALLOWED_ORIGINS = [
        "https://helpcenter.example.com",
        "http://localhost:5173",
    ]
    CORS_ALLOW_CREDENTIALS = True
```

- For the chatbot widget to function inside an external website, ensure the frontend origin is added to this list.

## Deployment

### Using Docker

1. Build the image

```bash
    docker build -f Dockerfile.backend -t hmis-backend . #make sure you are in the server directory before you run this command
```

1. Run the container

```bash
    docker run -p **8080**:**8080** --env-file .env hmis-backend # make sure you set your database strictly url to "postgresql://postgres:postgres@host.docker.internal:5432/hmis_kb_db" to avoid errors the reason is explained below
    #or run this is you get errors
    docker run -p 8080:8080 \
        -e DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5432/hmis_kb_db \
        -e SECRET_KEY=<you-secret-key> \
        -e ALLOWED_HOST=localhost,127.0.0.1 \
        -e GROQ_API_KEY=<your-api-key> \
        -e SIGNING_KEY=<your-signing-key> \
        -e DEBUG=0 \
        -e FRONTEND_URL=<your-url> \
        -e CLOUDINARY_CLOUD_NAME=<your-cloudname> \
        -e CLOUDINARY_API_SECRET=<your-secret> \
        -e CLOUDINARY_API_KEY=<your-api-key> \
        -e BREVO_API_KEY=<your-api-key> \
        -e BREVO_SMTP_PASSWORD=<your-pwd> \
        -e BREVO_SMTP_USER=<your-smtp-user> \
        -e DEFAULT_FROM_EMAIL=<your-default-email> \
        -e EMAIL_HOST=<your-email-host> \
        <your-docker-image-name>
```

**Genarating the secret key and signing key**:

- Run the following command in your terminal

```bash
python -c "import os; print(os.urandom(32))"
```

This will generate a 32 bit long string that you can use for `SIGNING_KEY` & `SECRET_KEY`

- To simplify it you can just pull the project's docker image from docker hub just replace the `<your-docker-image-name>` with kimmuna/hmis-kb-backend

- Also if you do not prefer the long `docker run` command you can use the docker compose file. **Note**: Your are going to need a bit more configuration like change your local db service to pg17

- `pgvector`'s own Dockerfile directly — it has no `VOLUME` declaration; it just builds on top of the official `postgres:18-bookworm/postgres:18-trixie` image. So this bug lives further upstream, in `docker-library/postgres`'s own pg18 image — and there's an open, currently-**unresolved GitHub issue** on exactly this `("Migration from v17 to v18 appears impossible," docker-library/postgres#1377)`. The "mount at` /var/lib/postgresql `only" fix works for some people depending on exact image variant/patch, but clearly not reliably for everyone yet — including us, even on a completely fresh volume.

- This is just a local dev problem it will not affect you Render deployment it only affects your local `docker-compose` testing setup

- **Here's why:** `docker-compose.yml`'s db service (running `pgvector/pgvector:pg18`) is a convenience container purely for local development — it's never deployed to Render. Render doesn't read or use `docker-compose.yml` at all; it only builds `Dockerfile.backend` for your web service. Your actual database on Render is a separate, managed Postgres instance (Render's own managed Postgres service) that you connect to via `DATABASE_URL` — Render runs and manages that Postgres server itself, not through this `pgvector/pgvector:pg18` image or its Docker `VOLUME`/mount behavior. So whatever Postgres major version Render's managed DB is running, this specific bug (which is about how this particular Docker image handles its data-directory mount) doesn't apply to it.

- So it's safe to switch the local `db` service to `pg17` — it only changes what you test against on your machine, has no bearing on your Render deployment, and gets you unblocked to finish verifying the actual memory fix, which is the thing that does matter for Render.


**On Render**

1. Push your code to a GitHub repository.

2. Create a new Web Service on Render, connect the repo.

3. Set the environment variables in the Render dashboard.

4. Render will automatically build and deploy on every push to the main branch.

## Testing

Run the test suite with:

```bash
    pytest -v The tests cover models, serializers, views, permissions, and the **RAG** pipeline (with mocked external calls).
```



## Troubleshooting

| Issue | Solution |
|-------|----------|
| **`pgvector` extension not found** | Ensure PostgreSQL has the `vector` extension enabled: `CREATE EXTENSION IF NOT EXISTS vector;` |
| **GROQ_API_KEY not set** | The chatbot will fail; set `GROQ_API_KEY` in `.env` |
| **CORS errors** | Add your frontend URL to `CORS_ALLOWED_ORIGINS` in `settings.py` |
| **Database connection refused** | Ensure PostgreSQL is running and `DATABASE_URL` is correct |


> For any issues, please open an issue on GitHub
