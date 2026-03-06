# SyncSpace

SyncSpace is a Spring Boot 3 backend (Java 17) with JWT-based authentication, MySQL persistence, and Spring Security.

## Backend Architecture

`backend/src/main/java/com/syncspace`

- `controller` - REST controllers (`/api/auth`, user, presence, chat APIs)
- `service` - business logic
- `repository` - Spring Data JPA repositories
- `model` - JPA entities
- `security` - JWT utility/filter and security chain
- `dto` - request/response DTOs
- `config` - CORS and WebSocket configuration
- `exception` - global exception handling
- `SyncSpaceApplication.java` - Spring Boot entry point

`backend/src/main/resources`

- `application.properties` - environment-based runtime configuration
- `application-example.properties` - safe template for required variables

## Required Environment Variables

Set these before running backend:

- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET` (must be at least 32 chars for HS256)

Optional:

- `DB_URL` (defaults to `jdbc:mysql://localhost:3306/syncspace?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`)
- `SERVER_PORT` (default `8080`)
- `JWT_EXPIRATION_MS` (default `86400000`)
- `JPA_DDL_AUTO` (default `update`)
- `JPA_SHOW_SQL` (default `true`)
- `HIBERNATE_FORMAT_SQL` (default `true`)

## Authentication Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`

## Run Commands

From `backend/`:

```bash
mvn clean install
mvn spring-boot:run
```

## Test Commands

From `backend/`:

```bash
mvn clean test
```

Auth integration tests validate:

- `POST /api/auth/register`
- `POST /api/auth/login`

## CI

GitHub Actions workflow is configured at `.github/workflows/backend-ci.yml` and runs backend `mvn clean test` on:

- pushes to `main`
- pull requests targeting `main`

## GitHub Safety Checklist

- Never commit `.env` or local config overrides.
- Keep all secrets in environment variables only.
- Rotate credentials immediately if they were previously committed.
- Verify staged files before push:

```bash
git status
git diff --staged
```
