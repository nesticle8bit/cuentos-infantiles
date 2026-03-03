import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cuento, ScanResult } from '../models/cuento.model';

@Injectable({ providedIn: 'root' })
export class CuentosService {
  private readonly API = '/api/cuentos';

  // Estado global del reproductor
  readonly currentCuento = signal<Cuento | null>(null);
  readonly isPlaying = signal(false);
  readonly playlist = signal<Cuento[]>([]);
  readonly currentIndex = signal(0);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Cuento[]> {
    return this.http.get<Cuento[]>(this.API);
  }

  getOne(id: number): Observable<Cuento> {
    return this.http.get<Cuento>(`${this.API}/${id}`);
  }

  registerPlay(id: number): Observable<{ veces_reproducido: number }> {
    return this.http.post<{ veces_reproducido: number }>(`${this.API}/${id}/play`, {});
  }

  scan(): Observable<ScanResult> {
    return this.http.post<ScanResult>(`${this.API}/scan`, {});
  }

  create(formData: FormData): Observable<Cuento> {
    return this.http.post<Cuento>(this.API, formData);
  }

  update(id: number, formData: FormData): Observable<Cuento> {
    return this.http.put<Cuento>(`${this.API}/${id}`, formData);
  }

  delete(id: number): Observable<{ mensaje: string; id: number }> {
    return this.http.delete<{ mensaje: string; id: number }>(`${this.API}/${id}`);
  }

  getCoverUrl(id: number): string {
    return `${this.API}/${id}/cover`;
  }

  getAudioUrl(id: number): string {
    return `${this.API}/${id}/audio`;
  }

  setPlaylist(cuentos: Cuento[], index: number) {
    this.playlist.set(cuentos);
    this.currentIndex.set(index);
    this.currentCuento.set(cuentos[index]);
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
