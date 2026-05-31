import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ParqueaderoService } from '../../../core/services/api.service';
import { ParqueaderoResponse } from '../../../core/models/models';

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
export class MisParqueaderosComponent implements OnInit {
  parqueaderos: ParqueaderoResponse[] = [];
  loading = false;
  showForm = false;
  mensaje = '';
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

  cargar(): void {
    this.loading = true;
    this.parqueaderoService.misParqueaderos().subscribe({
      next: (data) => { this.parqueaderos = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  buscarCoordenadas(): void {
    const direccion = this.form.get('direccion')?.value;
    const municipio = this.form.get('municipio')?.value;
    const departamento = this.form.get('departamento')?.value;
    if (!direccion || !municipio) return;
    this.buscandoCoordenadas = true;

    const normalizada = this.normalizarDireccion(direccion);
    const query = `${normalizada}, ${municipio}, ${departamento}, Colombia`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

    this.http.get<any[]>(url).subscribe({
      next: (results) => {
        if (results && results.length > 0) {
          this.form.patchValue({ latitud: parseFloat(results[0].lat), longitud: parseFloat(results[0].lon) });
          this.mensaje = '📍 Ubicación encontrada en el mapa';
          this.buscandoCoordenadas = false;
        } else {
          // Segundo intento solo con municipio
          const url2 = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(municipio + ', ' + departamento + ', Colombia')}&format=json&limit=1`;
          this.http.get<any[]>(url2).subscribe({
            next: (r2) => {
              this.buscandoCoordenadas = false;
              if (r2 && r2.length > 0) {
                this.form.patchValue({ latitud: parseFloat(r2[0].lat), longitud: parseFloat(r2[0].lon) });
                this.mensaje = '📍 Ubicación aproximada al municipio (dirección exacta no encontrada)';
              } else {
                this.mensaje = '⚠️ No se pudo obtener la ubicación.';
              }
            },
            error: () => { this.buscandoCoordenadas = false; this.mensaje = '⚠️ Error al buscar ubicación.'; }
          });
        }
      },
      error: () => { this.buscandoCoordenadas = false; this.mensaje = '⚠️ Error al buscar ubicación.'; }
    });
  }

  private normalizarDireccion(dir: string): string {
    return dir
      .toLowerCase()
      .replace(/\bkra\b/g, 'Carrera')
      .replace(/\bcr\b/g, 'Carrera')
      .replace(/\bcra\b/g, 'Carrera')
      .replace(/\bcarr\b/g, 'Carrera')
      .replace(/\bk\b/g, 'Carrera')
      .replace(/\bcll\b/g, 'Calle')
      .replace(/\bcl\b/g, 'Calle')
      .replace(/\bclle\b/g, 'Calle')
      .replace(/\bav\b/g, 'Avenida')
      .replace(/\bave\b/g, 'Avenida')
      .replace(/\bdg\b/g, 'Diagonal')
      .replace(/\bdiag\b/g, 'Diagonal')
      .replace(/\btv\b/g, 'Transversal')
      .replace(/\btr\b/g, 'Transversal')
      .replace(/\btrans\b/g, 'Transversal')
      .replace(/\bcir\b/g, 'Circular')
      .replace(/\bac\b/g, 'Autopista')
      .replace(/#/g, 'No.')
      .replace(/\s+/g, ' ')
      .trim();
  }

  crear(): void {
    if (this.form.invalid) return;
    this.parqueaderoService.crear(this.form.value).subscribe({
      next: () => {
        this.mensaje = '✅ Parqueadero creado. Pendiente de aprobación por el administrador.';
        this.showForm = false; this.form.reset(); this.cargar();
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
