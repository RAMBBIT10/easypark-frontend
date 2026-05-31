import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ParqueaderoService, ReservaService } from '../../../core/services/api.service';
import { ParqueaderoResponse } from '../../../core/models/models';
import * as L from 'leaflet';

@Component({
  selector: 'app-buscar-parqueaderos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent],
  templateUrl: './buscar-parqueaderos.component.html',
  styleUrls: ['./buscar-parqueaderos.component.scss']
})
export class BuscarParqueaderosComponent implements OnInit, AfterViewInit, OnDestroy {
  parqueaderos: ParqueaderoResponse[] = [];
  parqueaderosFiltrados: ParqueaderoResponse[] = [];
  parqueaderoSeleccionado: ParqueaderoResponse | null = null;
  parqueaderoUbicacion: ParqueaderoResponse | null = null;
  reservaForm: FormGroup;
  filtroMunicipio = '';
  loading = false;
  loadingReserva = false;
  mensaje = '';
  error = '';
  vistaActiva: 'lista' | 'mapa' | 'ubicacion' = 'lista';

  private map: L.Map | null = null;
  private mapUbicacion: L.Map | null = null;
  private markers: L.Marker[] = [];

  constructor(
    private parqueaderoService: ParqueaderoService,
    private reservaService: ReservaService,
    private fb: FormBuilder
  ) {
    this.reservaForm = this.fb.group({
      placa: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}[0-9]{3}$|^[A-Z]{3}[0-9]{2}[A-Z]$/)]],
      fechaInicio: ['', Validators.required]
    });
  }

  ngOnInit(): void { this.cargarParqueaderos(); }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void {
    if (this.map) { this.map.remove(); this.map = null; }
    if (this.mapUbicacion) { this.mapUbicacion.remove(); this.mapUbicacion = null; }
  }

  cargarParqueaderos(): void {
    this.loading = true;
    this.parqueaderoService.listarDisponibles().subscribe({
      next: (data) => { this.parqueaderos = data; this.parqueaderosFiltrados = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  filtrar(): void {
    if (!this.filtroMunicipio.trim()) { this.parqueaderosFiltrados = this.parqueaderos; return; }
    const f = this.filtroMunicipio.toLowerCase();
    this.parqueaderosFiltrados = this.parqueaderos.filter(p =>
      p.municipio?.toLowerCase().includes(f) || p.departamento?.toLowerCase().includes(f) || p.nombre?.toLowerCase().includes(f));
  }

  mostrarMapa(): void { this.vistaActiva = 'mapa'; setTimeout(() => this.inicializarMapa(), 100); }
  mostrarLista(): void {
    this.vistaActiva = 'lista';
    if (this.map) { this.map.remove(); this.map = null; }
    if (this.mapUbicacion) { this.mapUbicacion.remove(); this.mapUbicacion = null; }
  }

  mostrarUbicacion(): void {
    this.vistaActiva = 'ubicacion';
    setTimeout(() => this.inicializarMapaUbicacion(), 100);
  }

  verUbicacionEnMapa(p: ParqueaderoResponse): void {
    this.parqueaderoUbicacion = p;
    this.cerrarModal();
    this.mostrarUbicacion();
  }

  getGoogleMapsUrl(p: ParqueaderoResponse): string {
    if (p.latitud && p.longitud) {
      return `https://www.google.com/maps/dir/?api=1&destination=${p.latitud},${p.longitud}`;
    }
    const query = encodeURIComponent(`${p.direccion}, ${p.municipio}, ${p.departamento}, Colombia`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  private inicializarMapaUbicacion(): void {
    if (this.mapUbicacion) { this.mapUbicacion.remove(); }
    const p = this.parqueaderoUbicacion;
    if (!p) return;
    const lat = p.latitud || 4.711;
    const lng = p.longitud || -74.0721;
    const zoom = p.latitud ? 16 : 6;
    this.mapUbicacion = L.map('mapa-ubicacion').setView([lat, lng], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.mapUbicacion);
    if (p.latitud && p.longitud) {
      L.marker([p.latitud, p.longitud])
        .bindPopup(`<b>🅿️ ${p.nombre}</b><br>📍 ${p.direccion}<br>🏙️ ${p.municipio}`)
        .addTo(this.mapUbicacion).openPopup();
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        L.circle([pos.coords.latitude, pos.coords.longitude], { color: '#0f3460', radius: 100 })
          .bindPopup('📍 Tu ubicación actual').addTo(this.mapUbicacion!);
      }, () => {});
    }
  }

  private inicializarMapa(): void {
    if (this.map) { this.map.remove(); }
    this.map = L.map('mapa-parqueaderos').setView([4.711, -74.0721], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(this.map);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        this.map!.setView([lat, lng], 14);
        L.circle([lat, lng], { color: '#0f3460', radius: 300 }).bindPopup('📍 Tu ubicación').addTo(this.map!);
      }, () => {});
    }
    this.parqueaderosFiltrados.forEach(p => {
      if (p.latitud && p.longitud) {
        const marker = L.marker([p.latitud, p.longitud])
          .bindPopup(`<b>🅿️ ${p.nombre}</b><br>📍 ${p.direccion}<br>🏙️ ${p.municipio}<br>💰 $${p.precioPorHora}/hora<br>
            <button onclick="window.seleccionarParqueadero('${p.id}')"
              style="margin-top:8px;padding:4px 12px;background:#0f3460;color:white;border:none;border-radius:4px;cursor:pointer">
              Reservar</button>`).addTo(this.map!);
        this.markers.push(marker);
      }
    });
    (window as any).seleccionarParqueadero = (id: string) => {
      const p = this.parqueaderos.find(x => x.id === id);
      if (p) this.seleccionar(p);
    };
  }

  seleccionar(p: ParqueaderoResponse): void {
    this.parqueaderoSeleccionado = p;
    this.mensaje = ''; this.error = ''; this.reservaForm.reset();
  }

  cerrarModal(): void { this.parqueaderoSeleccionado = null; this.reservaForm.reset(); }

  reservar(): void {
    if (this.reservaForm.invalid || !this.parqueaderoSeleccionado) return;
    this.loadingReserva = true; this.error = '';
    const v = this.reservaForm.value;
    const request = {
      parqueaderoId: this.parqueaderoSeleccionado.id,
      placa: v.placa.toUpperCase(),
      fechaInicio: new Date(v.fechaInicio).toISOString()
    };
    this.reservaService.crear(request).subscribe({
      next: () => {
        this.loadingReserva = false;
        this.mensaje = '✅ ¡Reserva activa! Dirígete al parqueadero. Cuando termines ve a "Mis reservas" y presiona Finalizar estadía.';
        setTimeout(() => this.cerrarModal(), 4000);
      },
      error: (err) => { this.loadingReserva = false; this.error = err.error?.message || 'Error al crear la reserva'; }
    });
  }
}
