import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-incio-sesion',
  imports: [],
  templateUrl: './incio-sesion.html',
  styleUrl: './incio-sesion.css',
})
export class IncioSesion {
  constructor(private router: Router) {}

  onLogin() {
    this.router.navigate(['/dashboard']);
  }
}
