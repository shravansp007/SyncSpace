# Engineering Decisions

## 1. Spring Boot + Angular Split
Reason:
- Clean separation between API/realtime backend and SPA frontend.
- Easier independent deployment and scaling.

Tradeoff:
- More moving parts than monolith templates.

## 2. JWT-Based Stateless Authentication
Reason:
- Simple and production-typical pattern for SPA + API architecture.
- Avoids sticky-session constraints.

Tradeoff:
- Requires secure token handling and expiration strategy.

## 3. MySQL for Core Persistence
Reason:
- Reliable relational model for users, meetings, invitations, and messages.

Tradeoff:
- Schema changes require migration discipline.

## 4. Redis for Cache/Presence Support
Reason:
- Fast state operations and scalable presence-related features.

Tradeoff:
- Additional infrastructure dependency.

## 5. Dual Realtime Paths (STOMP + Socket.IO)
Reason:
- Backend-managed business events via STOMP.
- Dedicated lightweight signaling service for call negotiation and room state.

Tradeoff:
- Two realtime protocols increase operational complexity.

## 6. Docker Compose for Local Integration
Reason:
- One-command setup for full-stack demonstration.
- Faster local setup for collaborators and reviewers.

Tradeoff:
- Local and production infra still need parity checks.
