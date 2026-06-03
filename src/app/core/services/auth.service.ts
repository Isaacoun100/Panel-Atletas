import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { AdminRegisterAthleteRequest, AdminRegisterAthleteResponse, AdminRegisterUserRequest, AdminRegisterUserResponse, SignInResponse, SignUpResponse } from "../models/auth.model";
import { SignInResponse, UpdateUserResponse } from "../models/auth.model";


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

  signUp(email: string, password: string) {
    return this.http.post<SignUpResponse>(`${this.base}/auth/v1/signup`,
      { email, password },
      { headers: { apikey: this.apiKey } }
    );
  }

  adminRegisterUser(data: AdminRegisterUserRequest) {
    const token = localStorage.getItem('access_token');

    return this.http.post<AdminRegisterUserResponse>(`${this.base}/functions/v1/admin-register-admin`,
      data,
      {
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );
  }

  adminRegisterAthlete(data: AdminRegisterAthleteRequest) {
    const token = localStorage.getItem('access_token');

    return this.http.post<AdminRegisterAthleteResponse>(`${this.base}/functions/v1/admin-register-athlete`,
      data,
      {
        headers: {
          apikey: this.apiKey,
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );
  }

  passwordRecovery(email: string) {
    return this.http.post(`${this.base}/auth/v1/recover`,
      { email },
      { headers: { apikey: this.apiKey } }
    );
  }

  updatePassword(newPassword: string, accessToken: string) {
    return this.http.put<UpdateUserResponse>(`${this.base}/auth/v1/user`,
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
