import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ReservaComponent } from './pages/reserva/reserva.component';

@Component({
  selector: 'app-root',
  imports: [ReservaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'reservasApp';
}
