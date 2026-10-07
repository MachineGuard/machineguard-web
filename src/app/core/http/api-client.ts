import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(API_CONFIG);
  get<T>(path: string): Observable<T> {
    return this.http.get<T>(this.url(path));
  }
  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }
  private url(path: string): string {
    return `${this.config.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  }
}
