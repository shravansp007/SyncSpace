import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// SockJS/STOMP CommonJS bundles can reference `global` in browser builds.
// Provide a browser-safe shim to avoid "ReferenceError: global is not defined".
(window as typeof window & { global?: typeof window }).global = window;

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
