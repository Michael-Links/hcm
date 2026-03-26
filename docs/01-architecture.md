# Links One – System Architecture

## Overview
This system implements the Links One HR platform for organization management, onboarding, and employee self-service.

The entire system runs in a single Docker container.

## Architecture Style
- Modular monolith
- API-first
- Frontend SPA + Backend REST API

## Components
- Nginx (frontend + reverse proxy)
- FastAPI backend
- SQLite database

## Localization
- Frontend localization is handled in the React SPA with centralized translation resources for `en` and `zh-HK`.
- Users can switch language in the UI, and the selected locale is persisted on the user account.
- The backend exposes user preference support so the chosen language follows the user across logins and devices.

## Principles
- No employee without position
- Hierarchy before onboarding
- HR Self-Service primary
- Max 3-step UX
