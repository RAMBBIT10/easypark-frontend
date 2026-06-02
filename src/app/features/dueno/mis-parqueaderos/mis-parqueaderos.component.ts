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
    if (!direccion || !municipio) {
      this.mensajeUbicacion = 'Escribe la direccion y el municipio primero.';
      return;
    }
    this.buscandoCoordenadas = true;
    this.mensajeUbicacion = '';
    this.form.patchValue({ latitud: null, longitud: null });

    const norm = this.normalizarDireccion(direccion);
    const intentos = [
      norm + ', ' + municipio + ', ' + departamento + ', Colombia',
      norm + ', ' + municipio + ', Colombia',
      direccion + ', ' + municipio + ', ' + departamento + ', Colombia',
      direccion + ', ' + municipio + ', Colombia',
      norm.split(' ').slice(0, 2).join(' ') + ', ' + municipio + ', Colombia',
      municipio + ', ' + departamento + ', Colombia'
    ];
    this.intentarBusqueda(intentos, 0, municipio);
  }

  private intentarBusqueda(intentos: string[], index: number, municipio: string): void {
    if (index >= intentos.length) {
      this.buscandoCoordenadas = false;
      this.mensajeUbicacion = 'No se encontro la ubicacion exacta.';
      return;
    }
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(intentos[index]) + '&format=json&limit=1&countrycodes=co';
    this.http.get<any[]>(url).subscribe({
      next: (r) => {
        if (r && r.length > 0) {
          this.buscandoCoordenadas = false;
          this.form.patchValue({ latitud: parseFloat(r[0].lat), longitud: parseFloat(r[0].lon) });
          const precision = index <= 1 ? 'exacta' : index <= 3 ? 'aproximada' : 'de la zona';
          this.mensajeUbicacion = 'Ubicacion ' + precision + ' encontrada';
        } else {
          setTimeout(() => this.intentarBusqueda(intentos, index + 1, municipio), 800);
        }
      },
      error: () => { setTimeout(() => this.intentarBusqueda(intentos, index + 1, municipio), 800); }
    });
  }

  private normalizarDireccion(dir: string): string {
    return dir
      .toLowerCase()
      .replace(/\bkra\b/g, 'Carrera').replace(/\bcra\b/g, 'Carrera').replace(/\bcr\b/g, 'Carrera')
      .replace(/\bcll\b/g, 'Calle').replace(/\bcl\b/g, 'Calle')
      .replace(/\bav\b/g, 'Avenida').replace(/\bave\b/g, 'Avenida')
      .replace(/\bdg\b/g, 'Diagonal').replace(/\btv\b/g, 'Transversal')
      .replace(/\btr\b/g, 'Transversal').replace(/\bcir\b/g, 'Circular')
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

  eliminar(p: ParqueaderoResponse): void {
    if (!confirm('Estas seguro de eliminar "' + p.nombre + '"?')) return;
    this.parqueaderoService.eliminar(p.id).subscribe({
      next: () => { this.mensaje = 'Parqueadero eliminado correctamente.'; this.cargar(); },
      error: (err) => { this.mensaje = err.error?.message || 'No se puede eliminar, tiene reservas activas.'; }
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