export interface CallParticipant {
  id: string;
  name: string;
  speaking: boolean;
  muted: boolean;
  cameraOn: boolean;
  isLocal: boolean;
}

export interface CallState {
  room: string;
  participants: CallParticipant[];
  connected: boolean;
  inviteLink: string;
}

