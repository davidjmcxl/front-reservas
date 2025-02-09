import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../material/material.module';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Habitacion, TipoHabitacion, Ubicacion, Hotel } from '../models/hotel.model';
import { HotelService } from '../../services/hotel.service';

@Component({
  selector: 'app-reserva',
  imports: [CommonModule,ReactiveFormsModule,MaterialModule],
  templateUrl: './reserva.component.html',
  styleUrl: './reserva.component.scss'
})
export class ReservaComponent implements OnInit{
  buscadorForm: FormGroup;
  hotelesFiltrados: Hotel[] = [];
  habitacionesDisponibles:Habitacion[]=[]
  constructor(private fb: FormBuilder, private hotelService: HotelService) {
    this.buscadorForm = this.fb.group({
      ciudad: [''],
      fechaEntrada: [''],
      fechaSalida: [''],
      cantidadPersonas: ['']
    });
  }

  ngOnInit() {}

  async buscarHoteles() {
    const { ciudad, cantidadPersonas } = this.buscadorForm.value;

    if (!ciudad || !cantidadPersonas) {
      return;
    }

    this.hotelesFiltrados = await this.hotelService.buscarHoteles(ciudad, cantidadPersonas);
    
    console.log(this.hotelesFiltrados);

  }
  getHabitacionesDisponibles(hotel: Hotel): number {
    const { cantidadPersonas } = this.buscadorForm.value;
     this.habitacionesDisponibles=(hotel.habitaciones || []).filter(h =>
      h.capacidad >= cantidadPersonas && h.disponible === true
    )
    return (hotel.habitaciones || []).filter(h =>
      h.capacidad >= cantidadPersonas && h.disponible === true
    ).length;
  }

}
