# HMIS-KB

## Getting Started

- Follow these steps to set up the project locally.

### Pre-requisites

- Python 3.14.6
- Node.js, React, and npm
- PostgresSQL
- Docker
- Cloud Providers (Render,AWS, DigitalOcean)

#### 1. Clone Repository

- There are 2 ways to clone the repo, you can use `CLI` command or a GUI like `GitHub Desktop`
- Recommend using `GitHub Desktop`
- **Use the link below for the tutorial on how to clone the repo:**:[Link](https://www.youtube.com/watch?v=PoZNIbs_wx8)

```bash
git clone https://github.com/your-org/HMIS_KB.git; cd HMIS_KB #make sure you go to the location you clone the repo in
```

---

## File Structure

```bash
├── client
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── public
│   ├── README.md
│   ├── src
│   └── vite.config.js
├── ERD
│   ├── HealthCare(KB)ERD.pdf
│   ├── HealthCare(KB)ERD.png
│   └── HealthCare(KB)ERD.sql
├── README.md
├── server
│   ├── analytics
│   ├── app
│   ├── articles
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── HMIS_KB_collection.yml
│   ├── manage.py
│   ├── pytest.ini
│   ├── README.md
│   ├── requirements.txt
│   ├── users
│   └── utils
└── System Design
├── HMIS_KB_system desgin.drawio.pdf
└── HMIS_KB_system desgin.drawio.png

```

---

## Backend Setup

```bash
python -m venv .venv
source .venv/bin/activate #linux(bash,Zsh) & macOS
source .venv/bin/activate.fish #linux(fish)

.venv\Scripts\activate #Windows

pip install -r requrements.txt
```

### PostgresSQL Setup

**1. Install PostgresSQL** - [Ubuntu guide](https://www.digitalocean.com/community/tutorials/how-to-install-postgresql-on-ubuntu-20-04-quickstart)

**2. Start the service**

```bash
sudo systemctl start postgresql   # Linux
brew services start postgresql    # macOS
```

**3. Create Database**

```bash
sudo -u postgres psql -c "CREATE DATABASE hmis_kb_db;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

**4. Create `.env`**

```env
SECRET_KEY=your-secret
DEBUG=True # dev prod change to false when setting up render instance
DATABASE_URL = postgresql://postgres:postgres@localhost:5432/hmis_kb_db  
```

**5. Run migrations**

- Check quality of migration before migrating run this:

```bash
python manage.py check
```

- If 0 issues are found run this commands to run migrations:

```bash
python manage.py makemigrations; python manage.py migrate
```

---

## Frontend Setup

```bash
cd client
npm install
```

**Create `client/.env`:**

```env
VITE_API=http://localhost:5000/api/v1
```

### Frontend Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_API` | Base URL for the Django API | `http://localhost:8000/api/v1` |

---

## ERD Diagrams

![erd-diagrams](./ERD/HealthCare(KB)ERD.png)
