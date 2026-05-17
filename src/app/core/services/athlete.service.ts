import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Athlete } from "../models/athlete.model";

@Injectable({ providedIn: 'root' })
export class AthleteService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  createAthleteRecord(data: Partial<Athlete>) {
    return this.http.post(`${this.base}/rest/v1/athletes`, data);
  }

  getOwnAthleteRecord() {
    return this.http.get(`${this.base}/rest/v1/athletes`,
      { params: { select: '*' } }
    );
  }

  updateOwnAthleteRecord(userId: string, data: Partial<Athlete>) {
    return this.http.patch(`${this.base}/rest/v1/athletes`,
      data,
      { params: { id_user: `eq.${userId}` } }
    );
  }
}