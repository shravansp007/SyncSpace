import { MeetingParticipant } from './meeting.model';

export interface RoomStatePayload {
  roomId: string;
  participants: MeetingParticipant[];
}

export interface ChatTypingPayload {
  roomId: string;
  userId: string;
  userName: string;
  typing: boolean;
}

export interface ChatSocketMessagePayload {
  id: string;
  roomId: string;
  senderEmail: string;
  content: string;
  createdAt: string;
}
