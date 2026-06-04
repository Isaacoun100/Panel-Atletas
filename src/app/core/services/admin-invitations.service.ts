import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";

export interface InviteUsersResponse {
  results?: Array<{
    email: string;
    status: 'sent' | 'error';
    reason?: string;
  }>;
  invited?: string[];
  errors?: unknown[];
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminInvitationsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  private apiKey = environment.supabaseKey;

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      apikey: this.apiKey,
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  inviteUsers(emails: string[], initialRole: 'athlete' | 'coach' | 'admin') {
    return this.http.post<InviteUsersResponse>(`${this.base}/functions/v1/invite-user`,
      { emails, initial_role: initialRole },
      { headers: this.getHeaders() }
    );
  }

  resendInvitation(email: string) {
    return this.http.post(`${this.base}/functions/v1/resend-invitation`,
      { email },
      { headers: this.getHeaders() }
    );
  }

  listInvitations() {
    return this.http.get(`${this.base}/rest/v1/users_invitations`,
      { params: { select: '*', order: 'created_at.desc' }, headers: this.getHeaders() }
    );
  }
}
