import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, collectionData, getDocs } from '@angular/fire/firestore';
import { combineLatest, from, map, Observable, switchMap } from 'rxjs';
import { Habitacion } from '../pages/models/hotel.model';
import { Reserva } from '../pages/models/reserva.model';
import emailjs from '@emailjs/browser';
@Injectable({
  providedIn: 'root'
})
export class HabitacionService {
  private hotelesRef;

  constructor(private firestore: Firestore) {
    this.hotelesRef = collection(this.firestore, 'hoteles');
  }

  /**
   * Obtiene una lista de  habitaciones disponibles
   * @returns Observable<Habitacion[]>
   */
  getHabitaciones(hotelId: string): Observable<Habitacion[]> {
    const habitacionesRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones`);
    return collectionData(habitacionesRef, { idField: 'id' }) as Observable<Habitacion[]>;
  }


  // Crear una reserva en una habitación

  async crearReservaEnHabitacion(hotelId: string, habitacionId: string, reserva: Reserva): Promise<string> {
    try {
      const reservasRef = collection(this.firestore, `hoteles/${hotelId}/habitaciones/${habitacionId}/reservas`);
      const docRef = await addDoc(reservasRef, reserva);
      return docRef.id;
    } catch (error) {
      console.error('Error al crear la reserva:', error);
      throw error;
    }
  }

  // Enviar correo de confirmación de reserva
  enviarCorreo(email: string, nombre: string, fechaEntrada: string, fechaSalida: string) {
    const templateParams = {
      email,
      nombre,
      fechaEntrada,
      fechaSalida
    };

    return emailjs.send('hotelesSmart', 'template_ich4rm2', templateParams, '6kl6OAyPG1B4qkX6m');
  }
}
