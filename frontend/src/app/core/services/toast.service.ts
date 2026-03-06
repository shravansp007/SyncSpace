import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['toast-success']
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4200,
      panelClass: ['toast-error']
    });
  }

  errorWithAction(message: string, actionLabel: string): Observable<void> {
    return this.snackBar
      .open(message, actionLabel, {
        duration: 6000,
        panelClass: ['toast-error']
      })
      .onAction();
  }
}
