import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  error = '';

  tiposDocumento = [
    { valor: 'CC', label: 'Cédula de Ciudadanía' },
    { valor: 'CE', label: 'Cédula de Extranjería' },
    { valor: 'PA', label: 'Pasaporte' },
    { valor: 'TI', label: 'Tarjeta de Identidad' }
  ];

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      tipoDocumento: ['CC', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(20)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['CONDUCTOR', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.authService.register(this.form.value).subscribe({
      next: (response) => {
        this.loading = false;
        switch (response.rol) {
          case 'CONDUCTOR': this.router.navigate(['/conductor/parqueaderos']); break;
          case 'DUENO': this.router.navigate(['/dueno/mis-parqueaderos']); break;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al registrar usuario';
      }
    });
  }
}