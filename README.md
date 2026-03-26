# Links One (Phase 1)

A production-ready HR platform from Links International for managing organizational hierarchy, employee onboarding, and self-service.

## Quick Start

```bash
docker compose up --build
```

Open **http://localhost** and log in:

| Role     | Email              | Password  |
|----------|--------------------|-----------|
| HR       | hr@ecm.com         | admin123  |
| Manager  | manager@ecm.com    | admin123  |
| Employee | employee@ecm.com   | admin123  |

## Features

- **Organization Hierarchy**: Group → Entity → Division → Department → Position
- **Employee Onboarding**: 3-step wizard (Position → Personal Info → Compensation)
- **Compensation**: Packages with recurring and one-time payments
- **Self-Service (ESS)**: Employees view/edit their profile
- **Manager Self-Service (MSS)**: Managers view their team
- **Role-based Access**: HR, Manager, Employee roles with enforced permissions
- **Localization**: English and Traditional Chinese for Hong Kong (`zh-HK`) with a user-selectable language switcher

## Language support

- Supported locales: `en`, `zh-HK`
- Users can switch languages from the login page and the authenticated app header
- The selected language is saved to the user account and cached in the browser for faster startup
- Traditional Chinese copy is written for Hong Kong workplace and HR usage

## Tech Stack

| Layer    | Technology                             |
|----------|----------------------------------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Backend  | FastAPI + SQLAlchemy + Pydantic        |
| Auth     | JWT + bcrypt                           |
| Database | SQLite                                 |
| Runtime  | Nginx + Uvicorn in Docker              |

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Tests
```bash
# Backend unit tests
cd backend && python -m pytest tests/ -v

# E2E tests (requires running system)
cd e2e && npm install && npx playwright install && npx playwright test

# Watch E2E tests run in a visible browser with a larger on-page cursor
# Defaults to http://localhost:5137 and can be overridden with PLAYWRIGHT_BASE_URL
cd e2e && npm run test:visible
```

## Azure deployment

This repo includes `.github/workflows/azure-deploy.yml` for GitHub Actions deployment to Azure App Service for Containers.

The workflow:
- runs backend tests
- builds the frontend
- builds and pushes the Docker image to Azure Container Registry
- deploys the image to Azure App Service

See `docs/07-docker-deployment.md` for the one-time Azure setup, GitHub secrets and variables, and SQLite persistence notes.

## Project Structure

```
hcm/
├── backend/          # FastAPI application
│   ├── app/          # Source code (models, schemas, routers, services)
│   ├── tests/        # pytest unit tests
│   └── seed.py       # Database seed script
├── frontend/         # React SPA
│   └── src/          # Components, pages, auth
├── e2e/              # Playwright E2E tests
├── docs/             # Architecture documentation
├── Dockerfile        # Multi-stage production build
├── docker-compose.yml
├── nginx.conf
└── start.sh          # Container entrypoint
```
