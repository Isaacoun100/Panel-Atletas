import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Athlete } from "../models/athlete.model";

@Injectable({ providedIn: 'root' })
export class AdminAthletesService {
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

  getAllAthletes() {
    return this.http.get(`${this.base}/rest/v1/athletes`,
      { params: { select: '*' },
        headers: this.getHeaders()
    });
  }

  updateAthleteRecord(userId: string, data: Partial<Athlete>) {
    return this.http.patch(`${this.base}/rest/v1/athletes`,
      data,
      { params: { id_user: `eq.${userId}` }, headers: this.getHeaders() }
    );
  }

  deleteAthleteRecord(userId: string) {
    return this.http.delete(`${this.base}/rest/v1/athletes`,
      { params: { id_user: `eq.${userId}` }, headers: this.getHeaders() }
    );
  }

  getAllMedals() {
    return this.http.get(`${this.base}/rest/v1/medals`, {
      params: {
        select: '*,users_profiles(name,first_last_name)',
        order: 'year.desc'},
        headers: this.getHeaders()
    });
  }
}