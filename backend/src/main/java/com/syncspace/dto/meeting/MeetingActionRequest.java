package com.syncspace.dto.meeting;

import jakarta.validation.constraints.NotNull;

public class MeetingActionRequest {

    @NotNull
    private Long meetingId;

    public Long getMeetingId() {
        return meetingId;
    }

    public void setMeetingId(Long meetingId) {
        this.meetingId = meetingId;
    }
}
