import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ParqueaderoService } from '../../../core/services/api.service';
import { ParqueaderoResponse } from '../../../core/models/models';
import * as L from 'leaflet';

export const DEPARTAMENTOS_COLOMBIA = [
  'Amazonas','Antioquia','Arauca','Atlántico','Bolívar','Boyacá','Caldas','Caquetá',
  'Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare',
  'Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo',
  'Quindío','Risaralda','San Andrés','Santander','Sucre','Tolima','Valle del Cauca',
  'Vaupés','Vichada'
];

@Component({
  selector: 'app-mis-parqueaderos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './mis-parqueaderos.component.html',
  styleUrls: ['./mis-parqueaderos.component.scss']
})
export class MisParqueaderosComponent implements OnInit, AfterViewInit, OnDestroy {
  parqueaderos: ParqueaderoResponse[] = [];
  loading = false;
  showForm = false;
  mensaje = '';
  buscandoCoordenadas = false;
  form: FormGroup;
  departamentos = DEPARTAMENTOS_COLOMBIA;

  private mapaForm: L.Map | null = null;
  private marcador: L.Marker | null = null;

  constructor(
    private parqueaderoService: ParqueaderoService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      direccion: ['', Validators.required],
      municipio: ['', Validators.required],
      departamento: ['', Validators.required],
      precioPorHora: ['', [Validators.required, Validators.min(0.01)]],
      latitud: [null],
      longitud: [null]
    });
  }

  ngOnInit(): void { this.cargar(); }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.destruirMapa(); }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      setTimeout(() => this.inicializarMapaForm(), 200);
    } else {
      this.destruirMapa();
      this.form.reset();
    }
  }

  private inicializarMapaForm(): void {
    this.destruirMapa();
    this.mapaForm = L.map('mapa-form').setView([4.711, -74.0721], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.mapaForm);

    this.mapaForm.on('click', (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      this.form.patchValue({ latitud: lat, longitud: lng });

      if (this.marcador) {
        this.marcador.setLatLng([lat, lng]);
      } else {
        this.marcador = L.marker([lat, lng], {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41], iconAnchor: [12, 41]
          })
        }).addTo(this.mapaForm!).bindPopup('🅿️ Mi parqueadero').openPopup();
      }
    });
  }

  private destruirMapa(): void {
    if (this.mapaForm) { this.mapaForm.remove(); this.mapaForm = null; }
    this.marcador = null;
  }

  centrarMapaEnMunicipio(): void {
    const municipio = this.form.get('municipio')?.value;
    const departamento = this.form.get('departamento')?.value;
    if (!municipio || !this.mapaForm) return;
    this.buscandoCoordenadas = true;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(municipio + ', ' + departamento + ', Colombia')}&format=json&limit=1`;
    this.http.get<any[]>(url).subscribe({
      next: (r) => {
        this.buscandoCoordenadas = false;
        if (r && r.length > 0) {
          this.mapaForm!.setView([parseFloat(r[0].lat), parseFloat(r[0].lon)], 14);
        }
      },
      error: () => { this.buscandoCoordenadas = false; }
    });
  }

  cargar(): void {
    this.loading = true;
    this.parqueaderoService.misParqueaderos().subscribe({
      next: (data) => { this.parqueaderos = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  crear(): void {
    if (this.form.invalid) return;
    this.parqueaderoService.crear(this.form.value).subscribe({
      next: () => {
        this.mensaje = '✅ Parqueadero creado. Pendiente de aprobación por el administrador.';
        this.showForm = false;
        this.destruirMapa();
        this.form.reset();
        this.cargar();
      },
      error: (err) => { this.mensaje = err.error?.message || 'Error al crear'; }
    });
  }

  toggleDisponibilidad(p: ParqueaderoResponse): void {
    this.parqueaderoService.actualizarDisponibilidad(p.id, !p.disponible).subscribe({
      next: () => this.cargar(),
      error: (err) => { this.mensaje = err.error?.message || 'Error'; }
    });
  }

  getEstadoClass(estado: string): string {
    const map: any = { PENDIENTE_APROBACION: 'pendiente', APROBADO: 'aprobado', RECHAZADO: 'rechazado' };
    return map[estado] || '';
  }
}