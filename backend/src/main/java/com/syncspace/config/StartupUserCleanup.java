package com.syncspace.config;

import com.syncspace.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Component
public class StartupUserCleanup {

    private static final Logger log = LoggerFactory.getLogger(StartupUserCleanup.class);

    private static final List<String> USERS_TO_REMOVE = List.of(
            "codex_login_20260306112110@syncspace.dev",
            "codex_test_20260306112110@syncspace.dev",
            "codexprotected20260306112140@syncspace.dev"
    );

    private final UserRepository userRepository;
    private final TransactionTemplate transactionTemplate;

    public StartupUserCleanup(UserRepository userRepository, TransactionTemplate transactionTemplate) {
        this.userRepository = userRepository;
        this.transactionTemplate = transactionTemplate;
    }

    @PostConstruct
    public void cleanupUnexpectedUsers() {
        long deleted = transactionTemplate.execute(status -> userRepository.deleteByEmailIn(USERS_TO_REMOVE));
        if (deleted > 0) {
            log.info("Startup cleanup removed {} unexpected users.", deleted);
        }
    }
}
