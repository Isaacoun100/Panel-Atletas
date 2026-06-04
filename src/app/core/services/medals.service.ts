import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Medal } from "../models/medal.model";

@Injectable({ providedIn: 'root' })
export class MedalsService {
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

  getOwnMedals() {
    return this.http.get(`${this.base}/rest/v1/medals`,
      { params: { select: '*', order: 'year.desc' }, headers: this.getHeaders() }
    );
  }

  createMedal(data: { id_user: string; competition_name: string; year: number; medal_type: string }) {
    return this.http.post(`${this.base}/rest/v1/medals`, data, { headers: this.getHeaders() });
  }

  updateMedal(medalId: string, data: Partial<Medal>) {
    return this.http.patch(`${this.base}/rest/v1/medals`,
      data,
      { params: { id_medal: `eq.${medalId}` }, headers: this.getHeaders() }
    );
  }

  deleteMedal(medalId: string) {
    return this.http.delete(`${this.base}/rest/v1/medals`,
      { params: { id_medal: `eq.${medalId}` }, headers: this.getHeaders() }
    );
  }
}
