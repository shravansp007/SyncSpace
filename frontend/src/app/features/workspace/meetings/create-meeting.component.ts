import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './create-meeting.component.html',
  styleUrls: ['./create-meeting.component.scss']
})
export class CreateMeetingComponent {
  loading = false;
  error = '';

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    startTime: ['', [Validators.required]],
    duration: [30, [Validators.required, Validators.min(5)]],
    participants: ['']
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    const value = this.form.getRawValue();
    this.http.post(`${environment.apiBaseUrl}/api/meetings`, value).subscribe({
      next: () => this.router.navigate(['/workspace/meetings']),
      error: (err) => {
        this.error = err?.error?.message || 'Failed to create meeting.';
        this.loading = false;
      }
    });
  }
}
