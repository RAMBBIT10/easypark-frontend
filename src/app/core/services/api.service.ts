import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParqueaderoRequest, ParqueaderoResponse, ReservaRequest, ReservaResponse } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ParqueaderoService {
  private apiUrl = `${environment.apiUrl}/parqueaderos`;
  constructor(private http: HttpClient) {}

  listarDisponibles(): Observable<ParqueaderoResponse[]> { return this.http.get<ParqueaderoResponse[]>(this.apiUrl); }
  crear(request: ParqueaderoRequest): Observable<ParqueaderoResponse> { return this.http.post<ParqueaderoResponse>(this.apiUrl, request); }
  misParqueaderos(): Observable<ParqueaderoResponse[]> { return this.http.get<ParqueaderoResponse[]>(`${this.apiUrl}/mis-parqueaderos`); }
  actualizarDisponibilidad(id: string, disponible: boolean): Observable<ParqueaderoResponse> {
    return this.http.patch<ParqueaderoResponse>(`${this.apiUrl}/${id}/disponibilidad`, null,
      { params: new HttpParams().set('disponible', disponible) });
  }
  listarPendientes(): Observable<ParqueaderoResponse[]> { return this.http.get<ParqueaderoResponse[]>(`${this.apiUrl}/admin/pendientes`); }
  aprobar(id: string): Observable<ParqueaderoResponse> { return this.http.patch<ParqueaderoResponse>(`${this.apiUrl}/admin/${id}/aprobar`, null); }
  rechazar(id: string, motivo?: string): Observable<ParqueaderoResponse> {
    const params = motivo ? `?motivo=${encodeURIComponent(motivo)}` : '';
    return this.http.patch<ParqueaderoResponse>(`${this.apiUrl}/admin/${id}/rechazar${params}`, null);
  }
  eliminar(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}

@Injectable({ providedIn: 'root' })
export class ReservaService {
  private apiUrl = `${environment.apiUrl}/reservas`;
  constructor(private http: HttpClient) {}

  crear(request: ReservaRequest): Observable<ReservaResponse> { return this.http.post<ReservaResponse>(this.apiUrl, request); }
  misReservas(): Observable<ReservaResponse[]> { return this.http.get<ReservaResponse[]>(`${this.apiUrl}/mis-reservas`); }
  cancelar(id: string): Observable<ReservaResponse> { return this.http.patch<ReservaResponse>(`${this.apiUrl}/${id}/cancelar`, null); }
  finalizarEstadia(id: string): Observable<ReservaResponse> { return this.http.patch<ReservaResponse>(`${this.apiUrl}/${id}/finalizar-estadia`, null); }
  conductorConfirmaPago(id: string): Observable<ReservaResponse> { return this.http.patch<ReservaResponse>(`${this.apiUrl}/${id}/conductor-confirma-pago`, null); }
  duenioConfirmaPago(id: string): Observable<ReservaResponse> { return this.http.patch<ReservaResponse>(`${this.apiUrl}/${id}/duenio-confirma-pago`, null); }
  reservasDeMisParqueaderos(): Observable<ReservaResponse[]> { return this.http.get<ReservaResponse[]>(`${this.apiUrl}/mis-parqueaderos-reservas`); }
  todasLasReservas(): Observable<ReservaResponse[]> { return this.http.get<ReservaResponse[]>(`${this.apiUrl}/admin/todas`); }
}