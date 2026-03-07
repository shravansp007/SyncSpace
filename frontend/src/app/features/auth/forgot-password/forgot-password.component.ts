import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  form: FormGroup;
  resetForm: FormGroup;
  loading = false;
  error = '';
  success = '';
  generatedToken = '';

  constructor(private readonly fb: FormBuilder, private readonly http: HttpClient) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    this.resetForm = this.fb.group({
      token: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post<{ message?: string; token?: string }>(
      `${environment.apiBaseUrl}/api/auth/forgot-password`,
      { email: this.form.value.email }
    ).subscribe({
      next: (response) => {
        this.generatedToken = response?.token || '';
        if (this.generatedToken) {
          this.resetForm.patchValue({ token: this.generatedToken });
        }
        this.success = response?.message || 'Reset token generated.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to generate reset token.';
        this.loading = false;
      }
    });
  }

  resetPassword(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.http.post<{ message?: string }>(
      `${environment.apiBaseUrl}/api/auth/reset-password`,
      this.resetForm.getRawValue()
    ).subscribe({
      next: (response) => {
        this.success = response?.message || 'Password reset successful.';
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to reset password.';
        this.loading = false;
      }
    });
  }
}
