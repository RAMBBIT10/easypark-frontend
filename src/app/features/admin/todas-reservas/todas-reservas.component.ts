import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { ReservaService } from '../../../core/services/api.service';
import { ReservaResponse } from '../../../core/models/models';

@Component({
  selector: 'app-todas-reservas',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './todas-reservas.component.html',
  styleUrls: ['./todas-reservas.component.scss']
})
export class TodasReservasComponent implements OnInit {
  reservas: ReservaResponse[] = [];
  loading = false;

  constructor(private reservaService: ReservaService) {}

  ngOnInit(): void {
    this.loading = true;
    this.reservaService.todasLasReservas().subscribe({
      next: (data) => { this.reservas = data; this.loading = false; },
      error: () => { this.loading = false; }
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
