import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { combineLatest, from, map, Observable, switchMap } from 'rxjs';
import { Habitacion } from '../pages/models/hotel.model';

@Injectable({
  providedIn: 'root'
})
export class HabitacionService {
  private hotelesRef;

  constructor(private firestore: Firestore) {
    this.hotelesRef = collection(this.firestore, 'hoteles');
  }

  getHabitaciones(hotelId: string): Observable<Habitacion[]> {
    const habitacionesRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones`);
    return collectionData(habitacionesRef, { idField: 'id' }) as Observable<Habitacion[]>;
  }

  /**
   * Deshabilita o habilita una habitación cambiando su estado de "disponible"
   * @param hotelId ID del hotel
   * @param habitacionId ID de la habitación
   * @param estado Nuevo estado de disponibilidad (true o false)
   */
  async cambiarEstadoHabitacion(hotelId: string, habitacionId: string, estado: boolean): Promise<void> {
    const habitacionDoc = doc(this.firestore, `hoteles/${hotelId}/habitaciones/${habitacionId}`);
    await updateDoc(habitacionDoc, { disponible: estado });
  }

}
