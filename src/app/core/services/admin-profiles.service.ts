import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { UserProfile } from "../models/profile.model";

@Injectable({ providedIn: 'root' })
export class AdminProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  private apiKey = environment.supabaseKey;

  // Método privado para construir las cabeceras con el token
  private getHeaders() {
    const token = localStorage.getItem('access_token');
    let headers: any = {
      'apikey': this.apiKey,
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  getAllProfiles() {
    return this.http.get(`${this.base}/rest/v1/users_profiles`,
      { params: { select: '*', order: 'created_at.desc' },
      headers: this.getHeaders() 
    });
  }

  updateAnyProfile(userId: string, data: Partial<UserProfile>) {
    return this.http.patch(`${this.base}/rest/v1/users_profiles`,
      data,
      { params: { id_user: `eq.${userId}` }, headers: this.getHeaders() }
    );
  }

  blockUnblockUser(userId: string, isActive: boolean) {
    return this.http.post(`${this.base}/functions/v1/set-user-active`,
      { user_id: userId, is_active: isActive },
      { headers: this.getHeaders() },
    );
  }

  deleteUser(userId: string) {
    return this.http.post(`${this.base}/functions/v1/delete-user`,
      { user_id: userId },
      { headers: this.getHeaders() }
    );
  }
}