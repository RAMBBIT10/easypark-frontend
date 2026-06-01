import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ReservaService } from '../../../core/services/api.service';
import { ReservaResponse } from '../../../core/models/models';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './mis-reservas.component.html',
  styleUrls: ['./mis-reservas.component.scss']
})
export class MisReservasComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  loading = false;
  mensaje = '';

  constructor(private reservaService: ReservaService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.reservaService.misReservas().subscribe({
      next: (data) => { this.reservas = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  finalizarEstadia(id: string): void {
    if (!confirm('¿Confirmas que ya terminaste de usar el parqueadero?')) return;
    this.reservaService.finalizarEstadia(id).subscribe({
      next: (r) => {
        this.mensaje = `⏱️ Estadía finalizada. Total a pagar: $${r.totalAPagar}. ¡Ahora confirma el pago!`;
        this.cargar();
      },
      error: (err) => { this.mensaje = err.error?.message || 'Error'; }
    });
  }

  confirmarPago(id: string): void {
    this.reservaService.conductorConfirmaPago(id).subscribe({
      next: (r) => {
        this.mensaje = r.estado === 'FINALIZADA'
          ? '✅ ¡Proceso finalizado! Pago confirmado por ambas partes.'
          : '✅ Confirmaste el pago. Esperando confirmación del dueño.';
        this.cargar();
      },
      error: (err) => { this.mensaje = err.error?.message || 'Error'; }
    });
  }

  puedeCancel(r: ReservaResponse): boolean {
    if (r.estado !== 'EN_CURSO') return false;
    const inicio = new Date(r.fechaInicio);
    const ahora = new Date();
    const minutos = (ahora.getTime() - inicio.getTime()) / 60000;
    return minutos <= 5;
  }

  cancelar(id: string): void {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return;
    this.reservaService.cancelar(id).subscribe({
      next: () => { this.mensaje = 'Reserva cancelada'; this.cargar(); },
      error: (err) => { this.mensaje = err.error?.message || 'Error al cancelar'; }
    });
  }

  getEstadoClass(estado: string): string {
    const map: any = {
      EN_CURSO: 'estado-curso', PENDIENTE_PAGO: 'estado-pendiente',
      FINALIZADA: 'estado-finalizada', CANCELADA: 'estado-cancelada'
    };
    return map[estado] || '';
  }

  getEstadoLabel(estado: string): string {
    const map: any = {
      EN_CURSO: '🔵 En curso', PENDIENTE_PAGO: '⏳ Pendiente pago',
      FINALIZADA: '✅ Finalizada', CANCELADA: '❌ Cancelada'
    };
    return map[estado] || estado;
  }
}