import { Component, inject, signal, computed, effect, PLATFORM_ID, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NAV_ROUTES } from '../../constants';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { VendorNotificationBellComponent } from "../../../features/vendor/components";
import { ConfirmDialogContainer } from '../../../shared/components/confirm-dialog/confirm-dialog-container.component';
import { ToastContainer } from '../../../shared/components/toast/toast.component';
import { ThemeToggleComponent, LanguageSwitcher } from '../../../shared/components';
import { VendorService } from '../../../features/vendor/services/vendor.service';
import { IVendorProfile } from '../../../features/vendor/interfaces/iworkshop-profile';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RtlDirective, TranslatePipe, VendorNotificationBellComponent, ConfirmDialogContainer, ToastContainer, ThemeToggleComponent, LanguageSwitcher],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.css',

})
export class VendorLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected translationService = inject(TranslationService);
  private vendorService = inject(VendorService);

  readonly navRoutes = NAV_ROUTES;
  readonly sidebarOpen = signal(false);
  /** Desktop sidebar: collapsed by default, toggled via button click */
  readonly sidebarExpanded = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  
  readonly workshopProfile = signal<IVendorProfile | null>(null);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.vendorService.getWorkshopProfile().subscribe({
        next: (profile) => this.workshopProfile.set(profile),
        error: (err) => console.error('Failed to fetch workshop profile', err)
      });
    }
  }

  /** Toggle desktop sidebar expand/collapse */
  toggleSidebarExpanded(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.sidebarExpanded.update(v => !v);
    }
  }

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

  logout() {
    this.authService.logout();
    this.router.navigate([this.navRoutes.LOGIN]);
  }
}

