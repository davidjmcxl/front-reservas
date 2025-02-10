import { CommonModule, formatDate } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../../material/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { HabitacionService } from '../../../../services/habitacion.service';
import { Habitacion, Hotel } from '../../../models/hotel.model';

@Component({
  selector: 'app-reserva-busqueda',
  templateUrl: './reserva-busqueda.component.html',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  styleUrls: ['./reserva-busqueda.component.css']
})
export class ReservaBusquedaComponent {

  reservaForm: FormGroup;
  habitacionesDisponibles: Habitacion[] = [];
  hotelId!: string;
  habitacionId!: string;

  constructor(
    private fb: FormBuilder,
    private habitacionService: HabitacionService,
    private dialogRef: MatDialogRef<ReservaBusquedaComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { hotel: Hotel, habitacion: Habitacion[], datosBusqueda: any }
  ) {

    this.hotelId = data.hotel.id as string;
    this.verificarDisponibilidad();
    this.reservaForm = this.fb.group({
      fechaEntrada: [data.datosBusqueda.fechaEntrada, Validators.required],
      fechaSalida: [data.datosBusqueda.fechaSalida, Validators.required],
      cantidadPersonas: [data.datosBusqueda.cantidadPersonas, [Validators.required, Validators.min(1)]],
      habitacion: ['', Validators.required],
      huespedes: this.fb.array([]),
      contactoEmergencia: this.fb.group({
        nombreCompleto: ['', Validators.required],
        telefono: ['', Validators.required]
      })
    });
    this.actualizarHuespedes(this.data.datosBusqueda.cantidadPersonas);
    this.reservaForm.get('habitacion')?.valueChanges.subscribe((habitacion) => {


      const habitacionSeleccionada = this.habitacionesDisponibles.find(h => h.id === habitacion);
      if (habitacionSeleccionada) {
        this.reservaForm.get('cantidadPersonas')?.setValue(habitacionSeleccionada.capacidad);

        this.habitacionId = habitacionSeleccionada.id as string;
      }
    });

    this.reservaForm.get('cantidadPersonas')?.valueChanges.subscribe((cantidad) => {
      this.actualizarHuespedes(cantidad);
    });
  }

  // Verificar disponibilidad de habitaciones
  verificarDisponibilidad() {
    const fechaActual = this.data.datosBusqueda.fechaEntrada;

    this.habitacionesDisponibles = (this.data.hotel.habitaciones as Habitacion[]).filter(habitacion => {
      if (!habitacion.reservas || habitacion.reservas.length === 0) {
        return habitacion.disponible === true; // Si no tiene reservas, solo verifica disponibilidad
      }


      const parseFecha = (fechaStr: string): Date => {
        const [dia, mes, anio] = fechaStr.split('/').map(Number);
        return new Date(anio, mes - 1, dia);
      };

      // Verificar si alguna reserva activa se cruza con la fecha actual
      const tieneReservaActiva = habitacion.reservas.some(reserva => {
        const fechaEntrada = parseFecha(reserva.fechaEntrada);
        const fechaSalida = parseFecha(reserva.fechaSalida);

        return fechaActual >= fechaEntrada && fechaActual <= fechaSalida;
      });

      return habitacion.disponible === true && !tieneReservaActiva;
    });
  }

  //  Getters
  get huespedes(): FormArray {
    return this.reservaForm.get('huespedes') as FormArray;
  }
  get capacidadHabitacionSeleccionada(): number {
    const habitacio = this.reservaForm.get('habitacion')?.value;
    const habitacion = this.habitacionesDisponibles.find(h => h.id === habitacio);
    return habitacion ? habitacion.capacidad : 1;
  }

  //  Actualizar cantidad de huespedes
  actualizarHuespedes(cantidad: number) {
    while (this.huespedes.length < cantidad) {
      this.huespedes.push(this.crearHuespedForm());
    }
    while (this.huespedes.length > cantidad) {
      this.huespedes.removeAt(this.huespedes.length - 1);
    }
  }

  //  Crear formulario de huesped
  crearHuespedForm(): FormGroup {
    return this.fb.group({
      nombreCompleto: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      genero: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern('[0-9]+')]]
    });
  }

  //  Reservar habitación
  reservar() {
    if (this.reservaForm.valid) {
      const reservaData = this.reservaForm.value;

      //  Formatear fechas
      const fechaEntrada = formatDate(new Date(reservaData.fechaEntrada), 'dd/MM/yyyy', 'es-ES');
      const fechaSalida = formatDate(new Date(reservaData.fechaSalida), 'dd/MM/yyyy', 'es-ES');


      const reservaInfo = {
        ...reservaData,
        fechaEntrada,
        fechaSalida
      }
      this.habitacionService.crearReservaEnHabitacion(this.hotelId, this.habitacionId, reservaInfo).then(() => {

        this.habitacionService.enviarCorreo(reservaData.huespedes.email[0], reservaData.contactoEmergencia.nombreCompleto, fechaEntrada, fechaSalida).then(() => {
          Swal.fire({
            title: 'Correo enviado',
            text: 'Se ha enviado un correo con los detalles de tu reserva',
            icon: 'info',
            confirmButtonText: 'Aceptar'
          });
          this.dialogRef.close();
        }, (error) => {
          Swal.fire({
            title: 'Error',
            text: 'Ha ocurrido un error al enviar el correo',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
          this.dialogRef.close();
        });
        this.dialogRef.close();
      }, (error) => {
        Swal.fire({
          title: 'Error',
          text: 'Ha ocurrido un error al confirmar tu reserva',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
        this.dialogRef.close();
      });


    }
  }

}
