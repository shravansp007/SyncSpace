package com.syncspace.dto.meeting;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public class VideoSignalMessage {

    @NotBlank
    private String meetingId;

    @NotBlank
    private String from;

    private String to;

    private Map<String, Object> payload;

    public String getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(String meetingId) {
        this.meetingId = meetingId;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getTo() {
        return to;
    }

    public void setTo(String to) {
        this.to = to;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }

    public void setPayload(Map<String, Object> payload) {
        this.payload = payload;
    }
}
