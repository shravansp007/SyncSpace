import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UiState {
  sidebarCollapsed: boolean;
  searchQuery: string;
}

const initialState: UiState = {
  sidebarCollapsed: false,
  searchQuery: ''
};

@Injectable({ providedIn: 'root' })
export class UiStateService {
  private readonly subject = new BehaviorSubject<UiState>(initialState);
  readonly state$ = this.subject.asObservable();

  get snapshot(): UiState {
    return this.subject.value;
  }

  toggleSidebar(): void {
    this.patch({ sidebarCollapsed: !this.snapshot.sidebarCollapsed });
  }

  setSearchQuery(searchQuery: string): void {
    this.patch({ searchQuery });
  }

  private patch(partial: Partial<UiState>): void {
    this.subject.next({ ...this.snapshot, ...partial });
  }
}
