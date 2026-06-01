import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../../constants';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';


@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RtlDirective, TranslatePipe],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.css',
  
})
export class VendorLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  readonly navRoutes = NAV_ROUTES;
  readonly sidebarOpen = signal(false);

  // Expose the current user from authService
  readonly currentUser = this.authService.currentUser;

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.router.navigate([this.navRoutes.LOGIN]);
  }
}
