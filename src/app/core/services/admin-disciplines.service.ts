import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Discipline } from "../models/discipline.model";

@Injectable({ providedIn: 'root' })
export class AdminDisciplinesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getAllDisciplines() {
    return this.http.get(`${this.base}/rest/v1/disciplines`,
      { params: { select: '*', order: 'name.asc' } }
    );
  }

  createDiscipline(data: { name: string; discipline_type: string; is_active?: boolean }) {
    return this.http.post(`${this.base}/rest/v1/disciplines`, data);
  }

  updateDiscipline(id: number, data: Partial<Discipline>) {
    return this.http.patch(`${this.base}/rest/v1/disciplines`,
      data,
      { params: { id_discipline: `eq.${id}` } }
    );
  }

  deleteDiscipline(id: number) {
    return this.http.delete(`${this.base}/rest/v1/disciplines`,
      { params: { id_discipline: `eq.${id}` } }
    );
  }

  getUserEnrollments(userId: string) {
    return this.http.get(`${this.base}/rest/v1/users_disciplines`, {
      params: {
        select: '*,disciplines(name,discipline_type)',
        fk_user: `eq.${userId}`,
        'disciplines.is_active': 'eq.true'
      }
    });
  }

  enrollUserInDiscipline(userId: string, disciplineId: number, isRepresentative = false) {
    return this.http.post(`${this.base}/rest/v1/users_disciplines`,
      { fk_user: userId, fk_discipline: disciplineId, is_representative: isRepresentative }
    );
  }

  updateUserEnrollment(enrollmentId: number, data: { is_representative: boolean }) {
    return this.http.patch(`${this.base}/rest/v1/users_disciplines`,
      data,
      { params: { id_user_discipline: `eq.${enrollmentId}` } }
    );
  }

  removeUserEnrollment(enrollmentId: number) {
    return this.http.delete(`${this.base}/rest/v1/users_disciplines`,
      { params: { id_user_discipline: `eq.${enrollmentId}` } }
    );
  }
}