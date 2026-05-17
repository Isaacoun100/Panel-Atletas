import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { UserProfile } from "../models/profile.model";

@Injectable({ providedIn: 'root' })
export class AdminProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAllProfiles() {
    return this.http.get(`${this.base}/rest/v1/users_profiles`,
      { params: { select: '*', order: 'created_at.desc' } }
    );
  }

  updateAnyProfile(userId: string, data: Partial<UserProfile>) {
    return this.http.patch(`${this.base}/rest/v1/users_profiles`,
      data,
      { params: { id_user: `eq.${userId}` } }
    );
  }

  blockUnblockUser(userId: string, isActive: boolean) {
    return this.http.post(`${this.base}/functions/v1/set-user-active`,
      { user_id: userId, is_active: isActive }
    );
  }

  deleteUser(userId: string) {
    return this.http.post(`${this.base}/functions/v1/delete-user`,
      { user_id: userId }
    );
  }
}