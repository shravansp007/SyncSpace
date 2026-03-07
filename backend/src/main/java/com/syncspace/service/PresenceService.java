package com.syncspace.service;

import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;

import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceService {

    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastSeen = new ConcurrentHashMap<>();
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>();
    private final ApplicationEventPublisher eventPublisher;
    private final ActiveUserService activeUserService;

    public PresenceService(ApplicationEventPublisher eventPublisher, ActiveUserService activeUserService) {
        this.eventPublisher = eventPublisher;
        this.activeUserService = activeUserService;
    }

    public void connect(String sessionId, String email) {
        userSessions.computeIfAbsent(email, ignored -> ConcurrentHashMap.newKeySet()).add(sessionId);
        sessionToUser.put(sessionId, email);
        activeUserService.addUser(email);
        publishPresenceEvent("USER_ONLINE", email);
    }

    public void disconnectBySession(String sessionId) {
        String email = sessionToUser.remove(sessionId);
        if (email == null) {
            return;
        }

        Set<String> sessions = userSessions.get(email);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(email);
                lastSeen.put(email, Instant.now());
                activeUserService.removeUser(email);
                publishPresenceEvent("USER_OFFLINE", email);
            }
        }
    }

    public boolean isOnline(String email) {
        Set<String> sessions = userSessions.get(email);
        return sessions != null && !sessions.isEmpty();
    }

    public Instant getLastSeen(String email) {
        return lastSeen.get(email);
    }

    public Set<String> onlineEmails() {
        Set<String> redisUsers = activeUserService.getActiveUsers();
        return redisUsers.isEmpty() ? userSessions.keySet() : redisUsers;
    }

    private void publishPresenceEvent(String event, String email) {
        eventPublisher.publishEvent(new PresenceChangedEvent(event, email, Instant.now(), onlineEmails().size()));
    }
}
