# FlowReport
How to Start the Full Stack Every Time
Window 1 — Database + API container:
powershellSet-Location C:\Users\User\Desktop\תואר\Projects\flowreport; docker-compose up -d
Window 2 — Backend dev server:
powershellSet-Location C:\Users\User\Desktop\תואר\Projects\flowreport\backend; $env:DB_HOST="localhost"; $env:DB_PORT="5439"; $env:DB_USER="postgres"; $env:DB_PASSWORD="postgres"; $env:DB_NAME="flowreport"; $env:DB_SSLMODE="disable"; $env:JWT_SECRET="flowreport-dev-secret-key-change-in-production"; $env:PORT="8081"; go run .\cmd\server\main.go
Window 3 — Frontend:
powershellSet-Location C:\Users\User\Desktop\תואר\Projects\flowreport\frontend; npm run dev
Enterprise SaaS platform for hierarchical weekly reporting.
Employees submit reports -> Managers approve -> Executives see live org-health dashboard.

## Tech Stack
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: Go 1.25 + Gin + GORM
- Database: PostgreSQL 16
- Auth: JWT (HS256) + bcrypt
- Infra: Docker + Docker Compose

## Demo Accounts (password: password123)
- sarah.jenkins@flowreport.com — CEO
- elena.rostova@flowreport.com — Manager
- or.sasson@flowreport.com — Employee
- ben.carter@flowreport.com — Employee
- maya.levi@flowreport.com — Employee

## Quick Start
1. docker-compose up -d
2. cd backend && go run ./cmd/seed/main.go
3. cd frontend && npm install && npm run dev
4. Open http://localhost:5173

## API Endpoints
- POST /v1/auth/register
- POST /v1/auth/login
- GET  /v1/users
- GET  /v1/users/me
- POST /v1/reports
- GET  /v1/reports
- PATCH /v1/reports/:id
- POST /v1/reports/:id/submit
- POST /v1/reports/:id/approve
- GET  /v1/metrics/departments
- GET  /v1/metrics/org-health

## Roadmap
- Redis session caching
- RabbitMQ async notifications
- Report cycle management UI
- Email notifications
- Audit log viewer
- Multi-tenant support
