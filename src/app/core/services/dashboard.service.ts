import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { DashboardParams, DashboardResponse } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/functions/v1/dashboard-stats`;
  private apiKey = environment.supabaseKey;

  private getHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { apikey: this.apiKey };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  getStats(params: DashboardParams = {}) {
    let httpParams = new HttpParams();
    if (params.activity_limit  != null) httpParams = httpParams.set('activity_limit',  params.activity_limit);
    if (params.activity_offset != null) httpParams = httpParams.set('activity_offset', params.activity_offset);
    if (params.activity_order  != null) httpParams = httpParams.set('activity_order',  params.activity_order);
    if (params.athletes_limit  != null) httpParams = httpParams.set('athletes_limit',  params.athletes_limit);
    if (params.athletes_offset != null) httpParams = httpParams.set('athletes_offset', params.athletes_offset);

    return this.http.get<DashboardResponse>(this.base, {
      headers: this.getHeaders(),
      params: httpParams,
    });
  }
}
