# API and Realtime Contract

## REST Base URL
- Local: `http://localhost:8080`

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Users and Presence
- `GET /api/users/me`
- `GET /api/users`
- `GET /api/users/count`
- `GET /api/users/active`
- `PUT /api/users/profile`
- `PUT /api/users/password`
- `GET /api/users/presence`
- `GET /api/users/online`

## Chat
- `POST /api/chat/send`
- `GET /api/chat/history/{receiverEmail}`
- `GET /api/chat/messages/{receiverEmail}`

## Meetings and Invitations
- `POST /api/meetings`
- `POST /api/meetings/create`
- `GET /api/meetings`
- `GET /api/meetings/active`
- `POST /api/meetings/{meetingId}/end`
- `POST /api/meetings/join/{meetingId}`
- `POST /api/invitations`
- `POST /api/invitations/send`
- `GET /api/invitations`

## Dashboard
- `GET /api/messages/today`
- `GET /api/dashboard/stats`
- `GET /api/activity/recent`

## STOMP/WebSocket (Backend)
- Endpoint: `/ws`
- App prefix: `/app`
- Broker prefixes: `/topic`, `/queue`
- Mappings:
  - `/app/chat.private`
  - `/app/chat.send`
  - `/app/video.offer` and `/app/video-offer`
  - `/app/video.answer` and `/app/video-answer`
  - `/app/video.candidate` and `/app/video-candidate`

## Socket.IO (Signaling Server)
- URL: `http://localhost:3000`
- Common events:
  - `join-room`, `leave-room`, `room-state`
  - `signal`, `user-joined`, `user-left`
  - `presence:list`, `presence:updated`, `presence:update`
  - `chat:typing`, `chat:message`
