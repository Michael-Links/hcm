# ECM — Employment Core Module (Phase 1)

A production-ready HR system for managing organizational hierarchy, employee onboarding, and self-service.

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
```

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
