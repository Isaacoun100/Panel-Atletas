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
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  createAthleteRecord(data: Partial<Athlete>) {
    return this.http.post<Athlete[]>(`${this.base}/rest/v1/athletes`,
      data,
      { headers: { ...this.getHeaders(), Prefer: 'return=representation' } }
    );
  }

  getOwnAthleteRecord() {
    return this.http.get(`${this.base}/rest/v1/athletes`,
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
