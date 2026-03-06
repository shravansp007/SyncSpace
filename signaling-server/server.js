const io = require('socket.io')(3000, {
  cors: { origin: '*' }
});

const roomParticipants = new Map();
const socketRoom = new Map();
const socketUser = new Map();
const presenceByEmail = new Map();

function nowIso() {
  return new Date().toISOString();
}

function ensureRoomMap(roomId) {
  if (!roomParticipants.has(roomId)) {
    roomParticipants.set(roomId, new Map());
  }
  return roomParticipants.get(roomId);
}

function normalizeUser(socket, user) {
  const base = user ?? {};
  return {
    id: String(base.id ?? socket.id),
    name: base.name ?? 'Member',
    email: base.email ?? `${socket.id}@syncspace.local`,
    muted: Boolean(base.muted),
    cameraOn: base.cameraOn !== false,
    joinedAt: base.joinedAt ?? nowIso()
  };
}

function roomState(roomId) {
  const room = roomParticipants.get(roomId);
  return {
    roomId,
    participants: room ? Array.from(room.values()) : []
  };
}

function broadcastPresenceList(targetSocket) {
  const payload = Array.from(presenceByEmail.values());
  if (targetSocket) {
    targetSocket.emit('presence:list', payload);
    return;
  }

  io.emit('presence:list', payload);
}

function upsertPresence(user, status = 'online') {
  if (!user.email) {
    return;
  }

  const current = presenceByEmail.get(user.email);
  presenceByEmail.set(user.email, {
    id: current?.id ?? Number.NaN,
    name: user.name,
    email: user.email,
    online: status === 'online',
    status,
    lastSeenAt: status === 'online' ? null : nowIso()
  });

  io.emit('presence:updated', presenceByEmail.get(user.email));
}

function removeFromRoom(socket) {
  const roomId = socketRoom.get(socket.id);
  if (!roomId) {
    return;
  }

  const room = roomParticipants.get(roomId);
  const participant = room?.get(socket.id);

  if (room && participant) {
    room.delete(socket.id);
    socket.to(roomId).emit('user-left', { roomId, participant });
    io.to(roomId).emit('room-state', roomState(roomId));

    if (room.size === 0) {
      roomParticipants.delete(roomId);
    }
  }

  socketRoom.delete(socket.id);
}

io.on('connection', (socket) => {
  const query = socket.handshake.query ?? {};
  const queryUser = {
    id: query.userId ? String(query.userId) : socket.id,
    name: query.name ? String(query.name) : 'Member',
    email: query.email ? String(query.email) : `${socket.id}@syncspace.local`
  };

  socketUser.set(socket.id, queryUser);
  upsertPresence(queryUser, 'online');
  broadcastPresenceList(socket);

  socket.on('register-user', (payload) => {
    const user = normalizeUser(socket, payload);
    socketUser.set(socket.id, user);
    upsertPresence(user, 'online');
    broadcastPresenceList();
  });

  socket.on('presence:request', () => {
    broadcastPresenceList(socket);
  });

  socket.on('presence:update', (payload) => {
    const user = socketUser.get(socket.id) ?? normalizeUser(socket, null);
    const status = payload?.status === 'idle' ? 'idle' : payload?.status === 'offline' ? 'offline' : 'online';
    upsertPresence(user, status);
    broadcastPresenceList();
  });

  socket.on('join-room', (payload) => {
    const roomId = typeof payload === 'string' ? payload : payload?.roomId;
    if (!roomId) {
      return;
    }

    removeFromRoom(socket);

    const participant = normalizeUser(socket, typeof payload === 'string' ? socketUser.get(socket.id) : payload?.user);

    socket.join(roomId);
    socketRoom.set(socket.id, roomId);

    const room = ensureRoomMap(roomId);
    room.set(socket.id, participant);

    socket.emit('room-state', roomState(roomId));
    socket.to(roomId).emit('user-joined', { roomId, participant });
    io.to(roomId).emit('room-state', roomState(roomId));

    upsertPresence(participant, 'online');
  });

  socket.on('leave-room', () => {
    removeFromRoom(socket);
  });

  socket.on('chat:typing', (payload) => {
    const roomId = payload?.roomId;
    if (!roomId) {
      return;
    }

    socket.to(roomId).emit('chat:typing', {
      roomId,
      userId: payload?.userId ?? socket.id,
      userName: payload?.userName ?? socketUser.get(socket.id)?.name ?? 'Member',
      typing: Boolean(payload?.typing)
    });
  });

  socket.on('chat:message', (payload) => {
    const roomId = payload?.roomId;
    if (!roomId) {
      return;
    }

    io.to(roomId).emit('chat:message', {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roomId,
      senderEmail: payload?.senderEmail ?? socketUser.get(socket.id)?.email,
      content: payload?.content ?? '',
      createdAt: nowIso()
    });
  });

  socket.on('signal', (data) => {
    const roomId = data?.roomId ?? socketRoom.get(socket.id);
    if (!roomId) {
      return;
    }

    socket.to(roomId).emit('signal', {
      from: socket.id,
      signal: data?.signal ?? data
    });
  });

  socket.on('disconnect', () => {
    const user = socketUser.get(socket.id);
    removeFromRoom(socket);

    if (user) {
      upsertPresence(user, 'offline');
      socketUser.delete(socket.id);
    }

    broadcastPresenceList();
  });
});

console.log('Signaling server running on port 3000');
