import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ParametroCatalogo {
  id?: number;
  clave: string;
  valor: string;
  descripcion: string;
  activo: boolean;
}

interface MensajeCatalogo {
  id?: number;
  codigo: string;
  mensaje: string;
  idioma: string;
  activo: boolean;
}

interface NotificacionCatalogo {
  id?: number;
  tipo: string;
  titulo: string;
  plantilla: string;
  activo: boolean;
}

@Component({
  selector: 'app-catalogos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalogos.component.html',
  styleUrls: ['./catalogos.component.scss']
})
export class CatalogosComponent implements OnInit {
  tabActiva = 'parametros';
  cargando = false;
  mensaje = '';
  parametros: ParametroCatalogo[] = [];
  mensajes: MensajeCatalogo[] = [];
  notificaciones: NotificacionCatalogo[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarParametros();
    this.cargarMensajes();
    this.cargarNotificaciones();
  }

  cargarParametros(): void {
    this.cargando = true;
    this.http.get<ParametroCatalogo[]>(`${environment.apiUrl}/catalogos/parametros`)
      .subscribe({
        next: (data) => { this.parametros = data; this.cargando = false; },
        error: () => { this.cargando = false; }
      });
  }

  cargarMensajes(): void {
    this.http.get<MensajeCatalogo[]>(`${environment.apiUrl}/catalogos/mensajes`)
      .subscribe({
        next: (data) => { this.mensajes = data; },
        error: () => {}
      });
  }

  cargarNotificaciones(): void {
    this.http.get<NotificacionCatalogo[]>(`${environment.apiUrl}/catalogos/notificaciones`)
      .subscribe({
        next: (data) => { this.notificaciones = data; },
        error: () => {}
      });
  }

  abrirFormulario(tipo: string): void {
    this.mensaje = `Para agregar registros al catálogo de ${tipo}, use el endpoint POST /catalogos/${tipo} desde Swagger.`;
    setTimeout(() => { this.mensaje = ''; }, 4000);
  }
}
