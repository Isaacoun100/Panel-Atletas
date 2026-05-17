import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class AdminInvitationsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  inviteUsers(emails: string[], initialRole: string) {
    return this.http.post(`${this.base}/functions/v1/invite-user`,
      { emails, initial_role: initialRole }
    );
  }

  resendInvitation(email: string) {
    return this.http.post(`${this.base}/functions/v1/resend-invitation`,
      { email }
    );
  }

  listInvitations() {
    return this.http.get(`${this.base}/rest/v1/users_invitations`,
      { params: { select: '*', order: 'created_at.desc' } }
    );
  }
}