export type ActivityAction =
  | 'user_registered'
  | 'invite_sent'
  | 'invite_accepted'
  | 'profile_updated'
  | 'user_deactivated'
  | 'user_activated'
  | 'discipline_created';

export interface DashboardStats {
  totalAthletes: number;
  thisMonthAthletes: number;
  activeDisciplines: number;
  pendingInvitations: number;
  inactiveAthletes: number;
}

export interface RecentAthlete {
  id_user: string;
  name: string;
  first_last_name: string;
  is_active: boolean;
  created_at: string;
}

export interface ActivityEntry {
  id_audit_log: string;
  action: ActivityAction;
  actor_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface DashboardResponse {
  stats: DashboardStats;
  recentAthletes: PaginatedResult<RecentAthlete>;
  activity: PaginatedResult<ActivityEntry>;
}

export interface DashboardParams {
  activity_limit?: number;
  activity_offset?: number;
  activity_order?: 'asc' | 'desc';
  athletes_limit?: number;
  athletes_offset?: number;
}
