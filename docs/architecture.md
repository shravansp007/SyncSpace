# Architecture Overview

## System Components
- `frontend` (Angular 17): user interface, auth flows, chat/meeting dashboards, websocket clients
- `backend` (Spring Boot): REST APIs, STOMP websocket messaging, business logic, persistence
- `signaling-server` (Node + Socket.IO): low-latency signaling and room events for live collaboration
- `mysql` (MySQL 8): relational storage for users, meetings, invitations, chat history
- `redis` (Redis 7): cache/presence support

## Runtime Data Flow
1. User authenticates via backend REST (`/api/auth/*`) and receives JWT.
2. Frontend sends JWT on protected API calls and websocket handshakes.
3. Persistent features (users, meetings, messages) are stored in MySQL through JPA repositories.
4. Presence and realtime message events flow through backend websocket endpoints and Socket.IO signaling server.
5. Dashboard and collaboration UI aggregate REST + realtime streams.

## Backend Package Layout
- `controller`: HTTP and STOMP entry points
- `service`: domain logic
- `repository`: data access
- `model`: entities
- `security`: JWT filters and access control
- `config`: CORS, websocket, cache, startup lifecycle hooks

## Non-Functional Notes
- Stateless auth with JWT for horizontal scaling.
- Service boundaries separated by responsibility, not by transport.
- Environment-driven config for secure deployment.
