import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ParqueaderoService } from '../../../core/services/api.service';
import { ParqueaderoResponse } from '../../../core/models/models';

@Component({
  selector: 'app-parqueaderos-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './parqueaderos-pendientes.component.html',
  styleUrls: ['./parqueaderos-pendientes.component.scss']
})
export class ParqueaderosPendientesComponent implements OnInit {
  parqueaderos: ParqueaderoResponse[] = [];
  loading = false;
  mensaje = '';
  parqueaderoArechazar: ParqueaderoResponse | null = null;
  motivoRechazo = '';

  constructor(private parqueaderoService: ParqueaderoService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.parqueaderoService.listarPendientes().subscribe({
      next: (data) => { this.parqueaderos = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  aprobar(id: string): void {
    this.parqueaderoService.aprobar(id).subscribe({
      next: () => { this.mensaje = '✅ Parqueadero aprobado exitosamente'; this.cargar(); },
      error: (err) => { this.mensaje = err.error?.message || 'Error al aprobar'; }
    });
  }

  abrirModalRechazo(p: ParqueaderoResponse): void { this.parqueaderoArechazar = p; this.motivoRechazo = ''; }

  confirmarRechazo(): void {
    if (!this.parqueaderoArechazar) return;
    this.parqueaderoService.rechazar(this.parqueaderoArechazar.id, this.motivoRechazo).subscribe({
      next: () => { this.mensaje = '❌ Parqueadero rechazado'; this.parqueaderoArechazar = null; this.motivoRechazo = ''; this.cargar(); },
      error: (err) => { this.mensaje = err.error?.message || 'Error al rechazar'; }
    });
  }

  cancelarRechazo(): void { this.parqueaderoArechazar = null; this.motivoRechazo = ''; }
}
