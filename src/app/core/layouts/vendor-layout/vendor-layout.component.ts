import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../../constants';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/i18n/translation.service';


@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RtlDirective, TranslatePipe],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.css',

})
export class VendorLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected translationService = inject(TranslationService);

  readonly navRoutes = NAV_ROUTES;
  readonly sidebarOpen = signal(false);

  // Localization signals and computeds
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly isRtl = computed(() => this.currentLang() === 'ar');

  // Expose the current user from authService
  readonly currentUser = this.authService.currentUser;

  toggleSidebar() {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  selectLanguage(lang: 'en' | 'ar'): void {
    this.translationService.setLanguage(lang);
  }

  logout() {
    this.authService.logout();
    this.router.navigate([this.navRoutes.LOGIN]);
  }
}
