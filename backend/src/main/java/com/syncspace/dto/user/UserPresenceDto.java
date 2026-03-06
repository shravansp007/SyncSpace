package com.syncspace.dto.user;

import java.time.Instant;

public class UserPresenceDto {
    private Long id;
    private String name;
    private String email;
    private boolean online;
    private Instant lastSeenAt;

    public UserPresenceDto(Long id, String name, String email, boolean online, Instant lastSeenAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.online = online;
        this.lastSeenAt = lastSeenAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public boolean isOnline() {
        return online;
    }

    public Instant getLastSeenAt() {
        return lastSeenAt;
    }
}
