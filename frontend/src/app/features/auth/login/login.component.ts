import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPw = false;
  error = '';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.http.post<{ token: string; id: number; name: string; email: string }>(
      `${environment.apiBaseUrl}/api/auth/login`, { email, password }
    ).subscribe({
      next: (res) => {
        localStorage.setItem('auth_token', res.token);
        const user = {
          id: res.id,
          name: res.name,
          email: res.email
        };

        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('syncspace.auth', JSON.stringify({ token: res.token, user }));
        this.router.navigate(['/workspace']);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Invalid email or password.';
        this.loading = false;
      }
    });
  }
}
