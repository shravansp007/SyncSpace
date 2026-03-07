package com.syncspace.service;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActiveUserService {

    private static final String ACTIVE_USERS_KEY = "active_users";

    private final StringRedisTemplate redisTemplate;
    private final Set<String> fallbackUsers = ConcurrentHashMap.newKeySet();

    public ActiveUserService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void addUser(String email) {
        fallbackUsers.add(email);
        try {
            redisTemplate.opsForSet().add(ACTIVE_USERS_KEY, email);
        } catch (Exception ignored) {
            // Redis unavailable: use fallback set
        }
    }

    public void removeUser(String email) {
        fallbackUsers.remove(email);
        try {
            redisTemplate.opsForSet().remove(ACTIVE_USERS_KEY, email);
        } catch (Exception ignored) {
            // Redis unavailable: use fallback set
        }
    }

    public Set<String> getActiveUsers() {
        try {
            Set<String> users = redisTemplate.opsForSet().members(ACTIVE_USERS_KEY);
            if (users == null) {
                return Collections.emptySet();
            }
            return new LinkedHashSet<>(users);
        } catch (Exception ignored) {
            return new LinkedHashSet<>(fallbackUsers);
        }
    }
}
