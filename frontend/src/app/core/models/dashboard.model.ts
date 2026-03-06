export interface DashboardStats {
  activeUsers: number;
  ongoingMeetings: number;
  chatMessages: number;
}

export interface SystemHealth {
  api: 'healthy' | 'degraded';
  websocket: 'connected' | 'disconnected';
  database: 'connected' | 'unknown';
  checkedAt: string;
  latencyMs: number | null;
}

export interface DashboardViewModel {
  stats: DashboardStats;
  health: SystemHealth;
}

