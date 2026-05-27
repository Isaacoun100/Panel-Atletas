import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";

@Injectable({ providedIn: 'root' })
export class DisciplinesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getActiveDisciplines() {
    return this.http.get(`${this.base}/rest/v1/disciplines`, {
      params: { select: '*', is_active: 'eq.true', order: 'name.asc' }
    });
  }

  getOwnEnrollments() {
    return this.http.get(`${this.base}/rest/v1/users_disciplines`, {
      params: {
        select: '*,disciplines(name,discipline_type)',
        'disciplines.is_active': 'eq.true'
      }
    });
  }

  enrollInDiscipline(disciplineId: number, isRepresentative = false) {
    return this.http.post(`${this.base}/rest/v1/users_disciplines`,
      { fk_discipline: disciplineId, is_representative: isRepresentative }
    );
  }

  updateEnrollment(enrollmentId: number, data: { is_representative: boolean }) {
    return this.http.patch(`${this.base}/rest/v1/users_disciplines`,
      data,
      { params: { id_user_discipline: `eq.${enrollmentId}` } }
    );
  }

  removeEnrollment(enrollmentId: number) {
    return this.http.delete(`${this.base}/rest/v1/users_disciplines`,
      { params: { id_user_discipline: `eq.${enrollmentId}` } }
    );
  }
}