package com.syncspace.service;

import java.time.Instant;

public record PresenceChangedEvent(
        String event,
        String email,
        Instant timestamp,
        int onlineCount
) {
}
