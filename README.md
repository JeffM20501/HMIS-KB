# HMIS-KB - TaifaCare Knowledge Base

HMIS-KB is a full‑stack knowledge base platform for healthcare workers, built with Django (backend), React (frontend), and deployed on AWS EKS with a CI/CD pipeline.

---

## Architecture

- **Frontend**: React + Vite, served via Nginx.
- **Backend**: Django + Django REST Framework, running on Gunicorn.
- **Database**: MySQL (provided by DevOps team).
- **Container Registry**: AWS ECR.
- **Orchestration**: AWS EKS (Kubernetes).
- **CI/CD**: GitHub Actions

---

## Getting Started

- Follow these steps to set up the project locally.

## Pre-requisites

To deploy or maintain this project, you need:

- [AWS CLI](https://aws.amazon.com/cli/) v2 configured with the `capstone` profile.
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed.
- [Docker](https://docs.docker.com/get-docker/) installed.
- Access to the ECR repositories: `<account-id>.dkr.ecr.eu-west-1.amazonaws.com/<your-namespace>/frontend` and `.../backend`.
- Access to the EKS cluster (`<your-clustername>`).
- GitHub repository with the following secrets configured:

| Secret Name | Description |
| ------------- | ------------- |
| `AWS_ACCESS_KEY_ID` | AWS IAM Access Key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key |
| `AWS_REGION` | AWS region (eu-west-1) |
| `ECR_REGISTRY_FE` | Full ECR URL for frontend |
| `ECR_REGISTRY_BE` | Full ECR URL for backend |
| `SECRET_KEY` | Django secret key (used in tests) |
| `GROQ_API_KEY` | Groq API key (optional) |

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/` (frontend and backend workflows). It runs on every push to main and consists of:

- Checkout code
- Configure AWS credentials
- Login to ECR
- Build and push images (with `latest` and `git-sha` tags)
- Deploy to EKS (update image, apply manifests, wait for rollout)

## 1. Clone Repository

- There are 2 ways to clone the repo, you can use `CLI` command or a GUI like `GitHub Desktop`
- Recommend using `GitHub Desktop`
- **Use the link below for the tutorial on how to clone the repo:**:[Link](https://www.youtube.com/watch?v=PoZNIbs_wx8)

```bash
git clone https://github.com/your-org/HMIS_KB.git; cd HMIS_KB #make sure you go to the location you clone the repo in
```

---

## File Structure

```bash
.
├── client
│   ├── Dockerfile.frontend
│   ├── eslint.config.js
│   ├── index.html
│   ├── node_modules
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── pnpm-workspace.yaml
│   ├── postcss.config.js
│   ├── public
│   ├── README.md
│   ├── src
│   ├── tailwind.config.js
│   └── vite.config.js
├── ERD
│   ├── HealthCare(KB)ERD.pdf
│   ├── HealthCare(KB)ERD.png
│   └── HealthCare(KB)ERD.sql
├── k8s
│   ├── deployment-backend.yml
│   ├── deployment-frontend.yml
│   ├── ingress.yml
│   ├── namespace.yml
│   ├── service-backend.yml
│   └── service-frontend.yml
├── LICENSE
├── README.md
├── RUNBOOK.md
├── server
│   ├── analytics
│   ├── app
│   ├── articles
│   ├── chatbot
│   ├── conftest.py
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── healthy_views.py
│   ├── HMIS_KB_collection.yml
│   ├── manage.py
│   ├── __pycache__
│   ├── pytest.ini
│   ├── README.md
│   ├── requirements-dev.txt
│   ├── requirements.txt
│   ├── templates
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
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
HUGGINGFACE_API_KEY=<yout-api-key>
BREVO_API_KEY=<your-api-key>
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

## Deployment

Deployment is fully automated via GitHub Actions. On every push to `main`:

1. The **frontend** image is built, tagged with the commit SHA, and pushed to ECR.
2. The **backend** image is built, tagged with the commit SHA, and pushed to ECR.
3. The CI/CD pipeline updates the Kubernetes Deployments with the new image tags and applies all manifests to the `jeff-muna` namespace.

### Manual Deployment (if needed)

```bash
# Configure kubectl
aws eks update-kubeconfig --name <your-cluster-name> --region <you-region> --profile capstone

# Apply all manifests
kubectl apply -f k8s/ -n jeff-muna
```

---

## ERD Diagrams

![erd-diagrams](./ERD/HealthCare(KB)ERD.png)
