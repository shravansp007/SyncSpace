import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ThemeMode = 'dark' | 'light';

const THEME_KEY = 'syncspace.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSubject = new BehaviorSubject<ThemeMode>(this.readInitialMode());
  readonly mode$ = this.modeSubject.asObservable();

  constructor() {
    this.apply(this.modeSubject.value);
  }

  get mode(): ThemeMode {
    return this.modeSubject.value;
  }

  toggle(): void {
    const nextMode: ThemeMode = this.mode === 'dark' ? 'light' : 'dark';
    this.set(nextMode);
  }

  set(mode: ThemeMode): void {
    this.modeSubject.next(mode);
    localStorage.setItem(THEME_KEY, mode);
    this.apply(mode);
  }

  private readInitialMode(): ThemeMode {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'light' ? 'light' : 'dark';
  }

  private apply(mode: ThemeMode): void {
    document.body.classList.toggle('theme-light', mode === 'light');
  }
}
