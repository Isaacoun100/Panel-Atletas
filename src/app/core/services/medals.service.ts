import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Medal } from "../models/medal.model";

@Injectable({ providedIn: 'root' })
export class MedalsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getOwnMedals() {
    return this.http.get(`${this.base}/rest/v1/medals`,
      { params: { select: '*', order: 'year.desc' } }
    );
  }

  createMedal(data: { id_user: string; competition_name: string; year: number; medal_type: string }) {
    return this.http.post(`${this.base}/rest/v1/medals`, data);
  }

  updateMedal(medalId: string, data: Partial<Medal>) {
    return this.http.patch(`${this.base}/rest/v1/medals`,
      data,
      { params: { id_medal: `eq.${medalId}` } }
    );
  }

  deleteMedal(medalId: string) {
    return this.http.delete(`${this.base}/rest/v1/medals`,
      { params: { id_medal: `eq.${medalId}` } }
    );
  }
}