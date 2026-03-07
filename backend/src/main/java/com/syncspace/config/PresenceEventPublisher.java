package com.syncspace.config;

import com.syncspace.service.PresenceChangedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class PresenceEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public PresenceEventPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void onPresenceChanged(PresenceChangedEvent event) {
        Map<String, Object> payload = Map.of(
                "event", event.event(),
                "email", event.email(),
                "timestamp", event.timestamp(),
                "onlineCount", event.onlineCount()
        );
        messagingTemplate.convertAndSend("/topic/presence", payload);
        messagingTemplate.convertAndSend("/topic/active-users", payload);
    }
}
