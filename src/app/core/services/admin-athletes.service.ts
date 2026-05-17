import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Athlete } from "../models/athlete.model";

@Injectable({ providedIn: 'root' })
export class AdminAthletesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAllAthletes() {
    return this.http.get(`${this.base}/rest/v1/athletes`,
      { params: { select: '*' } }
    );
  }

  updateAthleteRecord(userId: string, data: Partial<Athlete>) {
    return this.http.patch(`${this.base}/rest/v1/athletes`,
      data,
      { params: { id_user: `eq.${userId}` } }
    );
  }

  deleteAthleteRecord(userId: string) {
    return this.http.delete(`${this.base}/rest/v1/athletes`,
      { params: { id_user: `eq.${userId}` } }
    );
  }

  getAllMedals() {
    return this.http.get(`${this.base}/rest/v1/medals`, {
      params: {
        select: '*,users_profiles(name,first_last_name)',
        order: 'year.desc'
      }
    });
  }
}