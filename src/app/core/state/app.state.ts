import { Injectable, signal, computed } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface IUserState {
  id: string;
  name: string;
  email: string;
  isAuthenticated: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppState {
  // Global user state signal
  readonly currentUser = signal<IUserState>({
    id: '',
    name: '',
    email: '',
    isAuthenticated: false
  });

  // Global feature flags signal
  readonly featureFlags = signal(environment.featureFlags);

  // Computed state to check auth
  readonly isAuthenticated = computed(() => this.currentUser().isAuthenticated);

  setUser(user: Omit<IUserState, 'isAuthenticated'>): void {
    this.currentUser.set({
      ...user,
      isAuthenticated: true
    });
  }

  clearUser(): void {
    this.currentUser.set({
      id: '',
      name: '',
      email: '',
      isAuthenticated: false
    });
  }
}
