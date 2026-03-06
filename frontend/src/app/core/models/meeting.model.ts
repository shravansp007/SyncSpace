export interface MeetingParticipant {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  muted: boolean;
  cameraOn: boolean;
}

export interface MeetingRoom {
  id: string;
  name: string;
  participants: MeetingParticipant[];
  createdAt: string;
  inviteLink: string;
}

export interface MeetingState {
  rooms: MeetingRoom[];
  activeRoomId: string | null;
}

