import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { UserProfile } from "../models/profile.model";

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  createProfile(data: Partial<UserProfile>) {
    return this.http.post(`${this.base}/rest/v1/users_profiles`, data);
  }

  getOwnProfile() {
    return this.http.get(`${this.base}/rest/v1/users_profiles`,
      { params: { select: '*' } }
    );
  }

  updateOwnProfile(userId: string, data: Partial<UserProfile>) {
    return this.http.patch(`${this.base}/rest/v1/users_profiles`,
      data,
      { params: { id_user: `eq.${userId}` } }
    );
  }
}