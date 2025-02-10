import { CommonModule, formatDate } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Habitacion, TipoHabitacion, Ubicacion, Hotel } from '../models/hotel.model';
import { HotelService } from '../../services/hotel.service';
import Swal from 'sweetalert2'
import { ReservaGeneralComponent } from './dialogs/reserva-general/reserva-general.component';
import { ReservaBusquedaComponent } from './dialogs/reserva-busqueda/reserva-busqueda.component';
@Component({
  selector: 'app-reserva',
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.scss'
})
export class ReservaComponent implements OnInit {
  buscadorForm: FormGroup;
  hoteles: Hotel[] = [];
  isfilter: boolean = false;
  hotelesFiltrados: Hotel[] = [];
  habitacionesDisponibles: Habitacion[] = []
  constructor(private fb: FormBuilder, private hotelService: HotelService,private dialog: MatDialog) {
    this.buscadorForm = this.fb.group({
      ciudad: ['', Validators.required],
      fechaEntrada: ['', Validators.required],
      fechaSalida: ['', Validators.required],
      cantidadPersonas: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit() {
    this.getAllHoteles()
  }

  // Obtener todos los hoteles
  getAllHoteles() {
    this.hotelService.obtenerHoteles().subscribe(resp => {

      this.hoteles = resp;
      this.hotelesFiltrados = resp;

    })
  }

  // Mostrar todos los hoteles cuando se prescione el botón de refresh
  mostrarTodosLosHoteles() {

    this.isfilter=false;
    this.buscadorForm.reset();
    this.hotelesFiltrados = [...this.hoteles];

  }

  // Buscar hoteles según los filtros ingresados
  async buscarHoteles() {
    const { ciudad, cantidadPersonas,fechaEntrada } = this.buscadorForm.value;

    // Si el usuario no ingresa filtros, mostramos todos los hoteles
    if (!ciudad && !cantidadPersonas) {
      this.hotelesFiltrados = [...this.hoteles];
      return;
    }
    this.isfilter = true;

    // Filtramos por ciudad y cantidad de personas
    let hotelesFiltradosTemp = await this.hotelService.buscarHoteles(ciudad, cantidadPersonas);

    // Filtrar los hoteles que tengan al menos 1 habitación disponible
    this.hotelesFiltrados = hotelesFiltradosTemp.filter(hotel =>
      this.getHabitacionesDisponibles(hotel) > 0
    );

    // Si no hay hoteles disponibles, asignamos un array vacío para que se muestre el mensaje
    if (this.hotelesFiltrados.length === 0) {
      this.hotelesFiltrados = [];
    }
    if (this.hotelesFiltrados.length === 0) {
      Swal.fire({
        title: 'No hay hoteles disponibles',
        text: 'Por favor intente con otros criterios',
        icon: 'info',
        confirmButtonText: 'Aceptar'
      });
    }
  }

  // Obtener la cantidad de habitaciones disponibles en un hotel
  getHabitacionesDisponibles(hotel: Hotel): number {
    const { cantidadPersonas,fechaEntrada } = this.buscadorForm.value;
    let fechaComparacion: Date;
    if(fechaEntrada){
      fechaComparacion = fechaEntrada;
    }
    else{
      fechaComparacion = new Date();
    }


    this.habitacionesDisponibles = (hotel.habitaciones || []).filter(habitacion => {
      // Verifica si la capacidad es suficiente y la habitación está disponible
      const esCapacidadSuficiente = habitacion.capacidad >= cantidadPersonas;
      const estaDisponible = habitacion.disponible === true;

      // Verifica si la habitación tiene reservas en la fecha actual
      const tieneReservaActiva = habitacion.reservas?.some(reserva => {

        const [diaEntrada, mesEntrada, añoEntrada] = reserva.fechaEntrada.split('/').map(Number);
        const [diaSalida, mesSalida, añoSalida] = reserva.fechaSalida.split('/').map(Number);

        const fechaEntrada = new Date(añoEntrada, mesEntrada - 1, diaEntrada);
        const fechaSalida = new Date(añoSalida, mesSalida - 1, diaSalida);

        // Comparar la fecha actual con el rango de reserva
        return fechaComparacion >= fechaEntrada && fechaComparacion <= fechaSalida;
      });

      // La habitación solo es válida si no tiene una reserva activa en la fecha actual
      return esCapacidadSuficiente && estaDisponible && !tieneReservaActiva;
    });

    return this.habitacionesDisponibles.length;
  }

  // Reservar una habitación
  reservar(hotel: Hotel) {
    if (this.getHabitacionesDisponibles(hotel) === 0) {
      Swal.fire({
        title: 'No hay habitaciones disponibles',
        text: 'por favor buscar en otro hotel',
        icon: 'error',
        confirmButtonText: 'salir'
      })
      return
    }
   if (this.isfilter) {
      // Abrir modal con formulario de huéspedes
      this.dialog.open(ReservaBusquedaComponent, {
        width: '700px',
        data: { hotel, habitacionesDisponibles: this.habitacionesDisponibles,datosBusqueda: this.buscadorForm.value }
      });
    } else {
      // Abrir modal con solo fechas y cantidad de personas
      this.dialog.open(ReservaGeneralComponent, {
        width: '700px',
        data: { hotel }
      });
    }

  }
}
