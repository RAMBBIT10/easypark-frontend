import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ParqueaderoService } from '../../../core/services/api.service';
import { ParqueaderoResponse } from '../../../core/models/models';

export const DEPARTAMENTOS_COLOMBIA = [
  'Amazonas','Antioquia','Arauca','Atlantico','Bolivar','Boyaca','Caldas','Caqueta',
  'Casanare','Cauca','Cesar','Choco','Cordoba','Cundinamarca','Guainia','Guaviare',
  'Huila','La Guajira','Magdalena','Meta','Narino','Norte de Santander','Putumayo',
  'Quindio','Risaralda','San Andres','Santander','Sucre','Tolima','Valle del Cauca',
  'Vaupes','Vichada'
];

@Component({
  selector: 'app-mis-parqueaderos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './mis-parqueaderos.component.html',
  styleUrls: ['./mis-parqueaderos.component.scss']
})
export class MisParqueaderosComponent implements OnInit {
  parqueaderos: ParqueaderoResponse[] = [];
  loading = false;
  showForm = false;
  mensaje = '';
  mensajeUbicacion = '';
  buscandoCoordenadas = false;
  form: FormGroup;
  departamentos = DEPARTAMENTOS_COLOMBIA;

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

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) { this.form.reset(); this.mensajeUbicacion = ''; }
  }

  buscarUbicacion(): void {
    const direccion = this.form.get('direccion')?.value;
    const municipio = this.form.get('municipio')?.value;
    const departamento = this.form.get('departamento')?.value;
    if (!direccion || !municipio) { this.mensajeUbicacion = 'Escribe la direccion y el municipio primero.'; return; }
    this.buscandoCoordenadas = true;
    this.mensajeUbicacion = 'Buscando...';
    this.form.patchValue({ latitud: null, longitud: null });
    const normalizada = this.normalizarDireccion(direccion);
    const intentos = [
      normalizada + ', ' + municipio + ', ' + departamento + ', Colombia',
      normalizada + ', ' + municipio + ', Colombia',
      direccion + ', ' + municipio + ', ' + departamento + ', Colombia',
      direccion + ', ' + municipio + ', Colombia',
      municipio + ', ' + departamento + ', Colombia'
    ];
    this.intentarBusqueda(intentos, 0, municipio);
  }

  private intentarBusqueda(intentos: string[], idx: number, mun: string): void {
    if (idx >= intentos.length) {
      this.buscandoCoordenadas = false;
      this.mensajeUbicacion = 'No se encontro la direccion exacta.';
      return;
    }
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(intentos[idx]) + '&format=json&limit=1&countrycodes=co';
    this.http.get<any[]>(url).subscribe({
      next: (r) => {
        if (r && r.length > 0) {
          this.buscandoCoordenadas = false;
          this.form.patchValue({ latitud: parseFloat(r[0].lat), longitud: parseFloat(r[0].lon) });
          this.mensajeUbicacion = idx <= 1 ? 'Direccion encontrada' : idx <= 3 ? 'Ubicacion aproximada en ' + mun : 'Centro de ' + mun;
        } else {
          setTimeout(() => this.intentarBusqueda(intentos, idx + 1, mun), 1200);
        }
      },
      error: () => { setTimeout(() => this.intentarBusqueda(intentos, idx + 1, mun), 1200); }
    });
  }

  private normalizarDireccion(dir: string): string {
    return dir
      .replace(/\bkra\b/gi, 'Carrera').replace(/\bcra\b/gi, 'Carrera').replace(/\bcr\b/gi, 'Carrera')
      .replace(/\bcll\b/gi, 'Calle').replace(/\bcl\b/gi, 'Calle')
      .replace(/\bav\b/gi, 'Avenida').replace(/\bdg\b/gi, 'Diagonal')
      .replace(/\btv\b/gi, 'Transversal').replace(/\btr\b/gi, 'Transversal')
      .replace(/#/g, '').replace(/\s+/g, ' ').trim();
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
        this.mensaje = 'Parqueadero creado. Pendiente de aprobacion.';
        this.showForm = false; this.form.reset(); this.mensajeUbicacion = ''; this.cargar();
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