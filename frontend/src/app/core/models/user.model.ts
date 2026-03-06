export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface UserPresence {
  id: number;
  name: string;
  email: string;
  online: boolean;
  lastSeenAt: string | null;
}

export interface PresenceMember extends UserPresence {
  status: PresenceStatus;
  isActive: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  online: boolean;
  lastSeenAt: string | null;
  role: 'Owner' | 'Admin' | 'Member';
}

