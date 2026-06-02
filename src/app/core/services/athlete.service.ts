import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Athlete } from "../models/athlete.model";

@Injectable({ providedIn: 'root' })
export class AthleteService {
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

  createAthleteRecord(data: Partial<Athlete>) {
    return this.http.post(`${this.base}/rest/v1/athletes`, data, { headers: this.getHeaders() });
  }

  getOwnAthleteRecord() {
    return this.http.get<Athlete[]>(`${this.base}/rest/v1/athletes`,
      { params: { select: '*' }, headers: this.getHeaders() }
    );
  }

  updateOwnAthleteRecord(userId: string, data: Partial<Athlete>) {
    return this.http.patch(`${this.base}/rest/v1/athletes`,
      data,
      { params: { id_user: `eq.${userId}` }, headers: this.getHeaders() }
    );
  }
}