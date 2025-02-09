export interface Reserva {
  id?: string;
  fechaEntrada: string;
  fechaSalida: string;
  cantidadPersonas: number;
  huespedes: Huesped[];
  contactoEmergencia: ContactoEmergencia;
}

export interface Huesped {
  nombreCompleto: string;
  fechaNacimiento: string;
  genero: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
  telefono: string;
}

export interface ContactoEmergencia {
  nombreCompleto: string;
  telefono: string;
}
