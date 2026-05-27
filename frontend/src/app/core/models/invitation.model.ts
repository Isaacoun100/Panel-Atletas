export type InvitationStatus = 'pending' | 'accepted';
export type UserRole = 'athlete' | 'coach' | 'admin';

export interface Invitation {
  id: string;
  email: string;
  initial_role: UserRole;
  status: InvitationStatus;
  attempt_count: number;
  created_at: string;
  expires_at: string;
}

export interface InviteUsersRequest {
  emails: string[];
  initial_role: UserRole;
}

export interface InviteUsersResponse {
  results: {
    email: string;
    status: 'sent' | 'error';
    reason?: string;
  }[];
}