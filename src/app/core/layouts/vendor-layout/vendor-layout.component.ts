import { Component, inject, signal, computed, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../../constants';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { VendorNotificationBellComponent } from "../../../features/vendor/components";


@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RtlDirective, TranslatePipe, VendorNotificationBellComponent],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.css',

})
export class VendorLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected translationService = inject(TranslationService);

  readonly navRoutes = NAV_ROUTES;
  readonly sidebarOpen = signal(false);

  readonly avatarError = signal(false);
  private readonly avatarResetEffect = effect(() => {
    this.currentUser()?.image;
    this.avatarError.set(false);
  });

  protected onAvatarError(): void {
    this.avatarError.set(true);
  }

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
