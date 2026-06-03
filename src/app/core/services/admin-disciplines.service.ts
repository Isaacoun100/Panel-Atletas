import { HttpClient } from "@angular/common/http";
import { inject, Injectable,  } from "@angular/core";
import { environment } from "../../environments/environment";
import { Discipline } from "../models/discipline.model";
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AdminDisciplinesService {
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

  getAllDisciplines() {
    return this.http.get(`${this.base}/rest/v1/disciplines`,
      { params: { select: '*', order: 'name.asc' },
      headers: this.getHeaders()
    });
  }

  createDiscipline(data: { name: string; discipline_type: string; is_active?: boolean }) {
    return this.http.post(`${this.base}/rest/v1/disciplines`, data, { headers: { ...this.getHeaders(), 'Prefer': 'return=representation' }});
  }

  updateDiscipline(id: number, data: Partial<Discipline>) {
    return this.http.patch(`${this.base}/rest/v1/disciplines`,
      data,
      { params: { id_discipline: `eq.${id}` }, headers: this.getHeaders() }
    );
  }

  deleteDiscipline(id: number) {
    return this.http.delete(`${this.base}/rest/v1/disciplines`,
      { params: { id_discipline: `eq.${id}` }, headers: this.getHeaders() }
    );
  }

  getUserEnrollments(userId: string) {
    return this.http.get(`${this.base}/rest/v1/users_disciplines`, {
      params: {
        select: '*,disciplines(name,discipline_type)',
        fk_user: `eq.${userId}`,
        'disciplines.is_active': 'eq.true'
      },
      headers: this.getHeaders()
    });
  }

  enrollUserInDiscipline(userId: string, disciplineId: number, isRepresentative = false) {
    return this.http.post(`${this.base}/rest/v1/users_disciplines`,
      { fk_user: userId, fk_discipline: disciplineId, is_representative: isRepresentative },
      { headers: this.getHeaders() }
    );
  }

  updateUserEnrollment(enrollmentId: number, data: { is_representative: boolean }) {
    return this.http.patch(`${this.base}/rest/v1/users_disciplines`,
      data,
      { params: { id_user_discipline: `eq.${enrollmentId}` }, headers: this.getHeaders() }
    );
  }

  removeUserEnrollment(enrollmentId: number) {
    return this.http.delete(`${this.base}/rest/v1/users_disciplines`,
      { params: { id_user_discipline: `eq.${enrollmentId}` }, headers: this.getHeaders() }
    );
  }

  // Método para contar atletas inscritos en una disciplina
  getAthletesCountByDiscipline(disciplineId: number) {
    return this.http.get<{ id_user_discipline: number }[]>(`${this.base}/rest/v1/users_disciplines`, {
      params: {
        select: 'id_user_discipline',
        fk_discipline: `eq.${disciplineId}`
      },
      headers: this.getHeaders()
    }).pipe(
      map((response) => response.length)
    );
  }
}