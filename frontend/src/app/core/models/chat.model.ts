export interface ChatMessage {
  id: number;
  roomId: string;
  senderEmail: string;
  content: string;
  messageType: string;
  createdAt: string;
}

export interface SendChatMessagePayload {
  roomId: string;
  content: string;
  senderEmail: string;
  messageType: 'MESSAGE';
}
