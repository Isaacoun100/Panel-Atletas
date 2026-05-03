import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-incio-sesion',
  imports: [FormsModule],
  templateUrl: './incio-sesion.html',
  styleUrl: './incio-sesion.css',
})
export class IncioSesion {
  constructor(private router: Router) {}

  onLogin() {
    this.router.navigate(['/dashboard']);
  }
}
