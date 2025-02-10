import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, collectionData, getDocs, query, where } from '@angular/fire/firestore';
import { combineLatest, from, map, Observable, switchMap } from 'rxjs';
import { Hotel, Habitacion } from '../pages/models/hotel.model';
import { Reserva } from '../pages/models/reserva.model';


@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private hotelesRef;

  constructor(private firestore: Firestore) {
    this.hotelesRef = collection(this.firestore, 'hoteles');
  }

  /**
   * Obtiene una lista de hoteles con sus habitaciones disponibles
   * @returns Observable<Hotel[]>
   */
  obtenerHoteles(): Observable<Hotel[]> {
    return collectionData(this.hotelesRef, { idField: 'id' }).pipe(
      map((hoteles) =>
        hoteles.map((hotel: any) => ({
          id: hotel.id,
          nombre: hotel.nombre,
          direccion: hotel.direccion,
          ciudad: hotel.ciudad,
          activo: hotel.activo,
          habitaciones: []
        }))
      ),
      switchMap((hoteles: Hotel[]) => {
        const hotelesConHabitaciones$ = hoteles.map(async (hotel) => {
          const habitacionesRef = collection(this.firestore, `hoteles/${hotel.id}/habitaciones`);
          const habitacionesSnapshot = await getDocs(habitacionesRef);

          const habitacionesConReservas = await Promise.all(
            habitacionesSnapshot.docs.map(async (doc) => {
              const habitacion = { id: doc.id, ...doc.data() } as Habitacion;

              //  Obtener reservas de la habitación
              const reservasRef = collection(this.firestore, `hoteles/${hotel.id}/habitaciones/${habitacion.id}/reservas`);
              const reservasSnapshot = await getDocs(reservasRef);

              habitacion.reservas = reservasSnapshot.docs.map(reservaDoc => ({
                id: reservaDoc.id,
                ...(reservaDoc.data() as Reserva)
              }));

              return habitacion;
            })
          );

          // Filtrar habitaciones disponibles
          const habitacionesDisponibles = habitacionesConReservas.filter(habitacion => habitacion.disponible);


          return habitacionesDisponibles.length > 0 ? { ...hotel, habitaciones: habitacionesDisponibles } : null;
        });

        return from(Promise.all(hotelesConHabitaciones$)).pipe(
          map(hoteles => hoteles.filter(hotel => hotel !== null))
        );
      })
    );
  }


  /**
   * Busca hoteles por ciudad y cantidad de personas
   * @param ciudad Ciudad a buscar
   * @param cantidadPersonas Cantidad de personas
   * @returns Promise<Hotel[]>
   */
  async buscarHoteles(ciudad: string, cantidadPersonas: number): Promise<Hotel[]> {
    const hotelesRef = collection(this.firestore, 'hoteles');
    let consulta = query(hotelesRef, where('ciudad', '==', ciudad));
    const querySnapshot = await getDocs(consulta);
    let hoteles: Hotel[] = [];

    for (const doc of querySnapshot.docs) {
      let hotel = doc.data() as Hotel;
      hotel.id = doc.id;

      // 🔹 Obtener habitaciones con reservas
      hotel.habitaciones = await this.obtenerHabitacionesConReservas(hotel.id);

      hoteles.push(hotel);
    }

    // 🔹 Filtrar hoteles con habitaciones disponibles y suficiente capacidad
    return hoteles.filter(hotel =>
      hotel.habitaciones?.some(habitacion =>
        habitacion.capacidad >= cantidadPersonas && habitacion.disponible === true
      )
    );
  }


  // Función para obtener habitaciones de un hotel
  async obtenerHabitacionesConReservas(hotelId: string): Promise<Habitacion[]> {
    const habitacionesRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones`);
    const habitacionesSnapshot = await getDocs(habitacionesRef);
    let habitaciones: Habitacion[] = [];

    for (const habitacionDoc of habitacionesSnapshot.docs) {
      let habitacion = habitacionDoc.data() as Habitacion;
      habitacion.id = habitacionDoc.id;

      // 🔹 Obtener reservas para esta habitación
      habitacion.reservas = await this.obtenerReservas(hotelId, habitacion.id);

      habitaciones.push(habitacion);
    }

    return habitaciones;
  }

  // Función para obtener reservas de una habitación
  async obtenerReservas(hotelId: string, habitacionId: string): Promise<Reserva[]> {
    const reservasRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones/${habitacionId}/reservas`);
    const reservasSnapshot = await getDocs(reservasRef);

    return reservasSnapshot.docs.map(reservaDoc => {
      let reserva = reservaDoc.data() as Reserva;
      reserva.id = reservaDoc.id;
      return reserva;
    });
  }


}
