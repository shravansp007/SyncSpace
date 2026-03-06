export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  status: 'online' | 'idle' | 'offline';
  lastSeen?: Date;
}
export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  roomId: string;
  timestamp: Date;
  read: boolean;
}
export interface ChatRoom {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}
export interface Meeting {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  participants: Participant[];
  inviteLink: string;
  startTime: Date;
  status: 'active' | 'scheduled' | 'ended';
}
export interface Participant {
  userId: string;
  name: string;
  avatar?: string;
  muted: boolean;
  cameraOff: boolean;
  isSpeaking: boolean;
}
export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  body: string;
  read: boolean;
  timestamp: Date;
}
