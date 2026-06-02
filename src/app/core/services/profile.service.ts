import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { UserProfile } from "../models/profile.model";

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  private apiKey = environment.supabaseKey;

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  createProfile(data: Partial<UserProfile>) {
    return this.http.post(`${this.base}/rest/v1/users_profiles`, data, { headers: this.getHeaders() });
  }

  getOwnProfile() {
    return this.http.get(`${this.base}/rest/v1/users_profiles`,
      { params: { select: '*' }, headers: this.getHeaders() }
    );
  }

  updateOwnProfile(userId: string, data: Partial<UserProfile>) {
    return this.http.patch(`${this.base}/rest/v1/users_profiles`,
      data,
      { params: { id_user: `eq.${userId}` }, headers: this.getHeaders() }
    );
  }
}