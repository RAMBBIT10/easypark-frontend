export interface Usuario { id: string; nombre: string; apellido: string; email: string; rol: Rol; activo: boolean; }
export type Rol = 'CONDUCTOR' | 'DUENO' | 'ADMINISTRADOR';

export interface LoginRequest { email: string; password: string; }
export type TipoDocumento = 'CC' | 'CE' | 'PA' | 'TI';
export interface RegisterRequest { nombre: string; apellido: string; tipoDocumento: TipoDocumento; numeroDocumento: string; email: string; password: string; rol: Rol; }
export interface LoginResponse { token: string; tipo: string; usuarioId: string; nombre: string; apellido: string; email: string; rol: Rol; }

export interface ParqueaderoRequest { nombre: string; descripcion?: string; direccion: string; municipio: string; departamento: string; precioPorHora: number; imagenUrl?: string; latitud?: number; longitud?: number; }
export interface ParqueaderoResponse { id: string; nombre: string; descripcion?: string; direccion: string; municipio: string; departamento: string; latitud?: number; longitud?: number; precioPorHora: number; disponible: boolean; estado: EstadoParqueadero; duenioId: string; duenioNombre: string; imagenUrl?: string; fechaCreacion: string; }
export type EstadoParqueadero = 'PENDIENTE_APROBACION' | 'APROBADO' | 'RECHAZADO' | 'INACTIVO';

export interface ReservaRequest { parqueaderoId: string; placa: string; fechaInicio: string; }
export interface ReservaResponse {
  id: string; conductorId: string; conductorNombre: string;
  parqueaderoId: string; parqueaderoNombre: string; parqueaderoDireccion: string; parqueaderoMunicipio: string;
  placa: string; fechaInicio: string; fechaFin?: string; totalAPagar?: number; estado: EstadoReserva;
  conductorConfirmoPago: boolean; duenioConfirmoPago: boolean; fechaConfirmacionPago?: string; fechaCreacion: string;
}
export type EstadoReserva = 'EN_CURSO' | 'PENDIENTE_PAGO' | 'PAGADA' | 'FINALIZADA' | 'CANCELADA';
