import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ReservaService } from '../../../core/services/api.service';
import { ReservaResponse } from '../../../core/models/models';

@Component({
  selector: 'app-reservas-parqueadero',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './reservas-parqueadero.component.html',
  styleUrls: ['./reservas-parqueadero.component.scss']
})
export class ReservasParqueaderoComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  loading = false;
  mensaje = '';

  constructor(private reservaService: ReservaService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.reservaService.reservasDeMisParqueaderos().subscribe({
      next: (data) => { this.reservas = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  confirmarPago(id: string): void {
    this.reservaService.duenioConfirmaPago(id).subscribe({
      next: (r) => {
        this.mensaje = r.estado === 'PAGADA'
          ? '✅ Pago confirmado por ambas partes'
          : 'Confirmaste el pago. Esperando confirmación del conductor.';
        this.cargar();
      },
      error: (err) => { this.mensaje = err.error?.message || 'Error'; }
    });
  }

  getEstadoClass(estado: string): string {
    const map: any = {
      PENDIENTE_PAGO: 'estado-pendiente', PAGADA: 'estado-pagada',
      EN_CURSO: 'estado-curso', FINALIZADA: 'estado-finalizada', CANCELADA: 'estado-cancelada'
    };
    return map[estado] || '';
  }
}
