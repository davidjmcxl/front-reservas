import { Reserva } from "./reserva.model";


export interface Habitacion {
  id?: string;
  nombre:string;
  tipo: TipoHabitacion;
  ubicacion:Ubicacion;
  capacidad: number;
  costoBase: number;
  impuestos: number;
  disponible: boolean;
  reservas?: Reserva[];
}

export interface Hotel {
  id?: string;
  nombre: string;
  direccion: string;
  activo: boolean;
  ciudad:string;
  habitaciones?: Habitacion[];
}

 export enum TipoHabitacion {
  SENCILLA = 'Sencilla',
  DOBLE = 'Doble',
  SUITE = 'Suite',
  FAMILIAR = 'Familiar'
}
export enum Ubicacion{
  PRIMER = '1 piso',
  SEGUNDO = '2 piso ',
  TERCER = '3 piso',
  CUARTO = '4 piso ',
  OTRO = 'Otro piso'
}

