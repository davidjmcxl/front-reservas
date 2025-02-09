import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, collectionData, getDocs, query, where } from '@angular/fire/firestore';
import { combineLatest, from, map, Observable, switchMap } from 'rxjs';
import { Hotel, Habitacion } from '../pages/models/hotel.model';


@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private hotelesRef;

  constructor(private firestore: Firestore) {
    this.hotelesRef = collection(this.firestore, 'hoteles');
  }

  obtenerHoteles(): Observable<Hotel[]> {
    return collectionData(this.hotelesRef, { idField: 'id' }).pipe(
      map((hoteles) =>
        hoteles.map((hotel: any) => ({
          id: hotel.id,
          nombre: hotel.nombre,
          direccion: hotel.direccion,
          ciudad:hotel.ciudad,
          activo: hotel.activo,
          habitaciones: [] // Inicializamos vacío, luego se llenará
        }))
      ),
      switchMap((hoteles: Hotel[]) => {
        const hotelesConHabitaciones$ = hoteles.map(async (hotel) => {
          const habitacionesRef = collection(this.firestore, `hoteles/${hotel.id}/habitaciones`);
          const habitacionesSnapshot = await getDocs(habitacionesRef);
          const habitaciones: Habitacion[] = habitacionesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }) as Habitacion);
          return { ...hotel, habitaciones };
        });

        return from(Promise.all(hotelesConHabitaciones$)); // Convierte la promesa en un Observable
      })
    );
  }
  async buscarHoteles(ciudad: string, cantidadPersonas: number): Promise<Hotel[]> {
    const hotelesRef = collection(this.firestore, 'hoteles');
    let consulta = query(hotelesRef, where('ciudad', '==', ciudad));
    const querySnapshot = await getDocs(consulta);
    let hoteles: Hotel[] = [];

    for (const doc of querySnapshot.docs) {
      let hotel = doc.data() as Hotel;

      hotel.id = doc.id;

      // 🔹 Obtener habitaciones desde la subcolección
      hotel.habitaciones = await this.obtenerHabitaciones(hotel.id);

      hoteles.push(hotel);
    }

    // 🔹 Filtrar solo hoteles con habitaciones disponibles y capacidad suficiente


      return hoteles.filter(hotel =>
        hotel.habitaciones?.some(habitacion =>
          habitacion.capacidad >= cantidadPersonas && habitacion.disponible === true
        )
      );
  }

  // Función para obtener habitaciones de un hotel
  private async obtenerHabitaciones(hotelId: string): Promise<Habitacion[]> {
    const habitacionesRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones`);
    const habitacionesSnapshot = await getDocs(habitacionesRef);

    return habitacionesSnapshot.docs.map(doc => {
      return {
        id: doc.id,
        ...doc.data()
      } as Habitacion;
    });
  }
}
