import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { SignedUrlResponse, StorageUploadResponse } from "../models/storage.model";

@Injectable({ providedIn: 'root' })
export class StorageService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/storage/v1`;
  private apiKey = environment.supabaseKey;
  private bucket = 'panel_files';

  private getHeaders(extra: Record<string, string> = {}): Record<string, string> {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'apikey': this.apiKey };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return { ...headers, ...extra };
  }

  // ── Avatar ──────────────────────────────────────────

  uploadAvatar(userId: string, file: File) {
    return this.http.post<StorageUploadResponse>(
      `${this.base}/object/${this.bucket}/avatars/${userId}/avatar.jpg`,
      file,
      {
        headers: this.getHeaders({
          'Content-Type': file.type || 'image/jpeg',
          'x-upsert': 'true',
        }),
      }
    );
  }

  getAvatarSignedUrl(userId: string, expiresIn = 3600) {
    return this.http.post<SignedUrlResponse>(
      `${this.base}/object/sign/${this.bucket}/avatars/${userId}/avatar.jpg`,
      { expiresIn },
      { headers: this.getHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  checkAvatarExists(userId: string) {
    return this.http.get(
      `${this.base}/object/${this.bucket}/avatars/${userId}/avatar.jpg`,
      { headers: this.getHeaders(), observe: 'response' as const }
    );
  }

  // ── Classification document ─────────────────────────

  uploadClassificationDocument(userId: string, file: File) {
    return this.http.post<StorageUploadResponse>(
      `${this.base}/object/${this.bucket}/files/${userId}/clasificacion.pdf`,
      file,
      {
        headers: this.getHeaders({
          'Content-Type': file.type || 'application/pdf',
          'x-upsert': 'true',
        }),
      }
    );
  }

  checkClassificationDocumentExists(userId: string) {
    return this.http.get(
      `${this.base}/object/${this.bucket}/files/${userId}/clasificacion.pdf`,
      { headers: this.getHeaders(), observe: 'response' as const }
    );
  }

  getClassificationDocSignedUrl(userId: string, expiresIn = 3600) {
    return this.http.post<SignedUrlResponse>(
      `${this.base}/object/sign/${this.bucket}/files/${userId}/clasificacion.pdf`,
      { expiresIn },
      { headers: this.getHeaders({ 'Content-Type': 'application/json' }) }
    );
  }
}
