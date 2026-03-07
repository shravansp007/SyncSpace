# SyncSpace

[![Backend CI](https://github.com/shravansp007/SyncSpace/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/shravansp007/SyncSpace/actions/workflows/backend-ci.yml)
[![Fullstack Quality](https://github.com/shravansp007/SyncSpace/actions/workflows/fullstack-quality.yml/badge.svg)](https://github.com/shravansp007/SyncSpace/actions/workflows/fullstack-quality.yml)

SyncSpace is a full-stack collaboration app for team chat, meeting coordination, presence tracking, and realtime signaling.

## Features
- JWT auth (register, login, forgot/reset password)
- Real-time collaboration (STOMP + SockJS + Socket.IO signaling)
- Presence and dashboard activity
- Meeting and invitation management
- Spring Boot 3 + Angular 17 + MySQL + Redis + Node signaling server

## Tech Stack
- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data JPA, WebSocket, Redis
- Frontend: Angular 17, RxJS, Angular Material
- Signaling: Node.js, Socket.IO
- Infra: MySQL 8, Redis 7, Docker Compose, GitHub Actions

## Architecture
See:
- [Architecture Notes](docs/architecture.md)
- [API and Realtime Contract](docs/api-contract.md)
- [Engineering Decisions](docs/decisions.md)

## Project Structure
- `backend/` Spring Boot API + WebSocket endpoints
- `frontend/` Angular SPA
- `signaling-server/` Socket.IO signaling service
- `docs/` architecture and design documents

## Quick Start (Local)
Prerequisites:
- Java 17
- Maven
- Node.js 20+
- MySQL 8
- Redis 7

1. Start backend
```powershell
cd "C:\Users\shrav\OneDrive\Desktop\SyncSpace\backend"
$env:DB_USERNAME="root"
$env:DB_PASSWORD="your_mysql_password"
$env:JWT_SECRET="replace_with_at_least_32_characters_secret"
mvn clean install
mvn spring-boot:run
```

2. Start signaling server
```powershell
cd "C:\Users\shrav\OneDrive\Desktop\SyncSpace\signaling-server"
npm install
node server.js
```

3. Start frontend
```powershell
cd "C:\Users\shrav\OneDrive\Desktop\SyncSpace\frontend"
npm install
npm start
```

4. Open app
- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8080`
- Signaling: `http://localhost:3000`

## Docker Run
```bash
docker compose up --build
```

Services:
- frontend: `http://localhost:4200`
- backend: `http://localhost:8080`
- signaling: `http://localhost:3000`
- mysql: `localhost:3306`
- redis: `localhost:6379`

## Environment Variables
Copy `.env.example` and set real values in your shell or CI environment.

Required:
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (minimum 32 characters)

Optional:
- `DB_URL`
- `SERVER_PORT`
- `JWT_EXPIRATION_MS`
- `JPA_DDL_AUTO`
- `JPA_SHOW_SQL`
- `HIBERNATE_FORMAT_SQL`
- `REDIS_HOST`
- `REDIS_PORT`

## Testing
- Backend: `cd backend && mvn clean test`
- Frontend build check: `cd frontend && npm run build`

## Security Notes
- No raw secrets are committed in tracked files.
- Use env vars for all credentials and tokens.
- `.env` and `application-local.properties` are gitignored.
- If any secret was ever exposed, rotate it immediately.
