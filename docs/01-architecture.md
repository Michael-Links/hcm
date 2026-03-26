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

## Principles
- No employee without position
- Hierarchy before onboarding
- HR Self-Service primary
- Max 3-step UX
