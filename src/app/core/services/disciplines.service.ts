import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class DisciplinesService {
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

  getActiveDisciplines() {
    return this.http.get(`${this.base}/rest/v1/disciplines`, {
      params: { select: '*', is_active: 'eq.true', order: 'name.asc' },
      headers: this.getHeaders()
    });
  }

  getOwnEnrollments() {
    return this.http.get(`${this.base}/rest/v1/users_disciplines`, {
      params: {
        select: '*,disciplines(name,discipline_type)',
        'disciplines.is_active': 'eq.true'
      },
      headers: this.getHeaders()
    });
  }

  enrollInDiscipline(disciplineId: number, isRepresentative = false, userId?: string) {
    return this.http.post(`${this.base}/rest/v1/users_disciplines`,
      {
        ...(userId ? { fk_user: userId } : {}),
        fk_discipline: disciplineId,
        is_representative: isRepresentative
      },
      { headers: this.getHeaders() }
    );
  }

  updateEnrollment(enrollmentId: number, data: { is_representative: boolean }) {
    return this.http.patch(`${this.base}/rest/v1/users_disciplines`,
      data,
      { params: { id_user_discipline: `eq.${enrollmentId}` }, headers: this.getHeaders() }
    );
  }

  removeEnrollment(enrollmentId: number) {
    return this.http.delete(`${this.base}/rest/v1/users_disciplines`,
      { params: { id_user_discipline: `eq.${enrollmentId}` }, headers: this.getHeaders() }
    );
  }
}
