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
import { DialogService } from '../../../shared/services/dialog.service';
import { PlatformService } from '../../services/platform.service';
import { OverlayStateService } from '../../services/overlay-state.service';
import { MobileLayoutComponent } from '../mobile-layout/mobile-layout.component';
import { ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-vendor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, RtlDirective, TranslatePipe, VendorNotificationBellComponent, ConfirmDialogContainer, ToastContainer, ThemeToggleComponent, LanguageSwitcher, MobileLayoutComponent],
  templateUrl: './vendor-layout.component.html',
  styleUrl: './vendor-layout.component.css',

})
export class VendorLayoutComponent implements OnInit, AfterViewInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  protected translationService = inject(TranslationService);
  private vendorService = inject(VendorService);
  private dialogService = inject(DialogService);
  readonly platform = inject(PlatformService);
  private overlayService = inject(OverlayStateService);

  readonly navRoutes = NAV_ROUTES;
  readonly sidebarOpen = signal(false);
  /** Desktop sidebar: collapsed by default, toggled via button click */
  readonly sidebarExpanded = signal(false);
  private readonly platformId = inject(PLATFORM_ID);
  private elRef = inject(ElementRef);
  
  readonly workshopProfile = signal<IVendorProfile | null>(null);

  private readonly sidebarOverlayRef = {
    id: 'vendor-sidebar',
    close: () => this.closeSidebar()
  };

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.vendorService.getWorkshopProfile().subscribe({
        next: (profile) => this.workshopProfile.set(profile),
        error: (err) => console.error('Failed to fetch workshop profile', err)
      });
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        const diagnostics = [];
        let current: HTMLElement | null = this.elRef.nativeElement.querySelector('.vendor-layout-wrapper') || this.elRef.nativeElement;
        
        while (current && current !== document.documentElement) {
          const style = window.getComputedStyle(current);
          diagnostics.push({
            Tag: current.tagName.toLowerCase(),
            Classes: current.className,
            ID: current.id,
            Width: style.width,
            ClientWidth: current.clientWidth,
            ScrollWidth: current.scrollWidth,
            OffsetWidth: current.offsetWidth,
            MaxWidth: style.maxWidth,
            MinWidth: style.minWidth,
            Margin: style.margin,
            Padding: style.padding,
            Overflow: style.overflow,
            Display: style.display,
            Position: style.position,
            Transform: style.transform
          });
          current = current.parentElement;
        }

        console.log('=== VENDOR PORTAL RESPONSIVE DIAGNOSTICS ===');
        console.log('window.innerWidth:', window.innerWidth);
        console.table(diagnostics);
      }, 2000);
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
    const open = !this.sidebarOpen();
    this.sidebarOpen.set(open);
    if (open) {
      this.overlayService.registerOverlay(this.sidebarOverlayRef);
    } else {
      this.overlayService.unregisterOverlay(this.sidebarOverlayRef.id);
    }
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
    this.overlayService.unregisterOverlay(this.sidebarOverlayRef.id);
  }

  logout() {
    this.dialogService.openConfirm({
      title: this.translationService.currentLang() === 'ar' ? 'تسجيل الخروج' : 'Logout',
      message: this.translationService.currentLang() === 'ar' ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 'Are you sure you want to log out?',
      confirmText: this.translationService.currentLang() === 'ar' ? 'تسجيل الخروج' : 'Logout',
      cancelText: this.translationService.currentLang() === 'ar' ? 'إلغاء' : 'Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        this.authService.logout();
        this.router.navigate([this.navRoutes.LOGIN]);
      }
    });
  }
}

