import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { SignInResponse } from "../models/auth.model";


@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;
  private apiKey = environment.supabaseKey;

  signIn(email: string, password: string) {
    return this.http.post<SignInResponse>(`${this.base}/auth/v1/token?grant_type=password`,
      { email, password },
      { headers: { apikey: this.apiKey } }
    );
  }

  passwordRecovery(email: string) {
    return this.http.post(`${this.base}/auth/v1/recover`,
      { email },
      { headers: { apikey: this.apiKey } }
    );
  }

  updatePassword(newPassword: string, accessToken: string) {
    return this.http.put(`${this.base}/auth/v1/user`,
      { password: newPassword },
      { headers: { apikey: this.apiKey, Authorization: `Bearer ${accessToken}` } }
    );
  }

  signOut(token: string) {
    return this.http.post(`${this.base}/auth/v1/logout?scope=global`, null,
      { headers: { apikey: this.apiKey, Authorization: `Bearer ${token}` } }
    );
  }
}