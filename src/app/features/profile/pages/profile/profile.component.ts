import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { OrdersApiService } from '../../../orders/data-access/orders-api.service';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { ProfileSettingsCard } from '../../components/profile-settings-card/profile-settings-card.component';
import { EditableProfileForm } from '../../components/editable-profile-form/editable-profile-form.component';
import { ChangePasswordForm } from '../../components/change-password-form/change-password-form.component';
import { ProfileAddressList } from '../../components/profile-address-list/profile-address-list.component';
import { IProfile } from '../../interfaces/iprofile';
import { IUpdateProfileDto } from '../../interfaces/iupdate-profile.dto';
import { IAddressDto } from '../../interfaces/iaddress.dto';
import { IOrder } from '../../../orders/interfaces';
import { NAV_ROUTES } from '../../../../core/constants/app-routes';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { environment } from '../../../../../environments/environment';
import { NotificationService } from '../../../notifications/services/notification.service';
import { ProductCacheService } from '../../../../core/services/product-cache.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RtlDirective,
    TranslatePipe,
    LazyImageDirective,
    ProfileSettingsCard,
    EditableProfileForm,
    ChangePasswordForm,
    ProfileAddressList,
    SkeletonLoader,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class Profile implements AfterViewInit, OnDestroy {
  private readonly profileService = inject(ProfileService);
  private readonly ordersApiService = inject(OrdersApiService);
  private readonly translationService = inject(TranslationService);
  private readonly notificationService = inject(NotificationService);
  private readonly uiState = inject(UiState);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly productCacheService = inject(ProductCacheService);

  readonly profile = signal<IProfile | null>(null);
  readonly loading = signal(true);
  readonly formSubmitting = signal(false);
  readonly selectedImage = signal<string | null>(null);
  readonly imageUploading = signal(false);

  readonly ordersCount = signal<number>(0);
  readonly favoritesCount = signal<number>(0);
  readonly recentOrders = signal<IOrder[]>([]);

  // Animated counter display values (count up from 0)
  readonly animatedOrders = signal<number>(0);
  readonly animatedFavorites = signal<number>(0);
  readonly animatedAddresses = signal<number>(0);

  private statsObserver: IntersectionObserver | null = null;
  private countersRan = false;

  readonly activeSection = signal<string>('profile');
  readonly isSidebarExpanded = signal<boolean>(false);
  readonly isMobileDrawerOpen = signal<boolean>(false);

  readonly currentTime = signal<string>('');
  readonly timePeriod = signal<string>('');
  readonly currentDate = signal<string>('');
  private clockTimer: any = null;

  readonly profilePreview = computed(() => this.selectedImage() ?? this.profile()?.profileImage ?? null);

  /**
   * Time-based greeting key — updates on each page load.
   * 05:00–11:59 → Morning | 12:00–16:59 → Afternoon | 17:00–04:59 → Evening
   */
  readonly greetingKey = computed((): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)  return 'PROFILE.GREETING_MORNING';
    if (hour >= 12 && hour < 17) return 'PROFILE.GREETING_AFTERNOON';
    return 'PROFILE.GREETING_EVENING';
  });

  /** Real-time notification unread count from the NotificationService signal */
  readonly notificationsUnreadCount = computed(() => this.notificationService.unreadCount());

  /** Sidebar badge counts — derived from real data; hide when 0 */
  readonly sidebarAddressCount = computed(() => this.profile()?.addresses?.length ?? 0);
  readonly sidebarOrdersCount   = computed(() => this.ordersCount());
  readonly sidebarFavoritesCount = computed(() => this.favoritesCount());

  get initials(): string {
    const name = this.profile()?.fullName || this.profile()?.userName || 'FM';
    return name
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  get isArabic(): boolean {
    return this.translationService.currentLang() === 'ar';
  }

  @ViewChild('profileAddresses', { static: false })
  private readonly profileAddressesRef?: ElementRef<HTMLElement>;

  @ViewChild('statsSection', { static: false })
  private readonly statsSectionRef?: ElementRef<HTMLElement>;

  readonly actionItems = computed(() => {
    const stats = this.profile()?.stats;
    const orders = this.ordersCount();
    const favorites = this.favoritesCount();
    const designs = stats?.roomsDesigned ?? 0;
    const isGoogle = this.profile()?.isGoogleUser ?? false;

    const items = [
      { 
        labelKey: 'PROFILE.MY_ORDERS', 
        route: NAV_ROUTES.ORDERS, 
        iconClass: 'bi-box-seam', 
        badgeValue: orders > 0 ? orders : undefined, 
        iconBg: 'rgba(13, 110, 253, 0.08)', 
        iconColor: '#0d6efd' 
      },
      { 
        labelKey: 'PROFILE.FAVORITES', 
        route: NAV_ROUTES.FAVORITES, 
        iconClass: 'bi-heart', 
        badgeValue: favorites > 0 ? favorites : undefined, 
        iconBg: 'rgba(220, 53, 69, 0.08)', 
        iconColor: '#dc3545' 
      },
      { 
        labelKey: 'PROFILE.AI_DESIGNS', 
        route: NAV_ROUTES.AI_CHAT, 
        iconClass: 'bi-sparkles', 
        badgeValue: designs > 0 ? designs : undefined, 
        iconBg: 'rgba(184, 147, 92, 0.1)', 
        iconColor: '#b8935c' 
      },
      { labelKey: 'PROFILE.PAYMENT_METHODS', route: '', iconClass: 'bi-credit-card', iconBg: 'rgba(111, 66, 193, 0.08)', iconColor: '#6f42c1' },
      { labelKey: 'PROFILE.ADDRESS', route: 'profile-addresses', iconClass: 'bi-geo-alt', iconBg: 'rgba(25, 135, 84, 0.08)', iconColor: '#198754' },
      { labelKey: 'PROFILE.NOTIFICATIONS', route: '/notifications', iconClass: 'bi-bell', iconBg: 'rgba(13, 202, 240, 0.08)', iconColor: '#0dcaf0' },
      { labelKey: 'PROFILE.PRIVACY_SECURITY', route: '', iconClass: 'bi-shield-check', iconBg: 'rgba(108, 117, 125, 0.08)', iconColor: '#6c757d' },
      { labelKey: 'PROFILE.DESIGN_PREFERENCES', route: '', iconClass: 'bi-palette', iconBg: 'rgba(253, 126, 20, 0.08)', iconColor: '#fd7e14' },
    ];

    if (isGoogle) {
      return items.filter(item => item.labelKey !== 'PROFILE.PRIVACY_SECURITY');
    }
    return items;
  });

  readonly sidebarStats = computed(() => {
    const stats = this.profile()?.stats;
    const orders = this.ordersCount();
    const favorites = this.favoritesCount();
    return [
      { labelKey: 'PROFILE.ORDERS_COUNT_LABEL', value: orders },
      { labelKey: 'PROFILE.DESIGNS_COUNT_LABEL', value: stats?.roomsDesigned ?? 0 },
      { labelKey: 'PROFILE.SAVED_COUNT_LABEL', value: favorites },
    ];
  });

  readonly profileStats = computed(() => {
    const stats = this.profile()?.stats;
    return [
      { labelKey: 'PROFILE.ROOMS_DESIGNED', value: stats?.roomsDesigned ?? 0 },
      { labelKey: 'PROFILE.PRODUCTS_VIEWED', value: stats?.productsViewed ?? 0 },
      { labelKey: 'PROFILE.RECOMMENDATIONS', value: stats?.recommendations ?? 0 },
      { labelKey: 'PROFILE.STYLES_EXPLORED', value: stats?.stylesExplored ?? 0 },
    ];
  });

  constructor() {
    this.loadProfile();
    this.updateClock();
    if (typeof window !== 'undefined') {
      this.clockTimer = setInterval(() => this.updateClock(), 1000);
    }
  }

  ngAfterViewInit(): void {
    // Set up IntersectionObserver to trigger counter animation when stats enter viewport
    if (typeof IntersectionObserver !== 'undefined' && this.statsSectionRef) {
      this.statsObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !this.countersRan) {
            this.countersRan = true;
            this.runCounters();
          }
        },
        { threshold: 0.2 }
      );
      this.statsObserver.observe(this.statsSectionRef.nativeElement);
    } else {
      // Fallback: set values immediately
      this.animatedOrders.set(this.ordersCount());
      this.animatedFavorites.set(this.favoritesCount());
      this.animatedAddresses.set(this.profile()?.addresses?.length ?? 0);
    }
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private updateClock(): void {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    this.currentTime.set(`${hours}:${minutes}`);
    this.timePeriod.set(period);

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    this.currentDate.set(now.toLocaleDateString('en-US', options));
  }

  private runCounters(): void {
    const targets = [
      { target: this.ordersCount(),                      setter: this.animatedOrders },
      { target: this.favoritesCount(),                   setter: this.animatedFavorites },
      { target: this.profile()?.addresses?.length ?? 0,  setter: this.animatedAddresses },
    ];

    const DURATION   = 900;  // ms total
    const FRAME_RATE = 16;   // ~60fps
    const steps      = Math.ceil(DURATION / FRAME_RATE);

    targets.forEach(({ target, setter }) => {
      if (target === 0) { setter.set(0); return; }
      let step = 0;
      const interval = setInterval(() => {
        step++;
        // Ease-out curve: value = target * (1 - (1 - t)^3)
        const t   = step / steps;
        const val = Math.round(target * (1 - Math.pow(1 - t, 3)));
        setter.set(Math.min(val, target));
        if (step >= steps) clearInterval(interval);
      }, FRAME_RATE);
    });
  }

  private async loadProfile(): Promise<void> {
    this.loading.set(true);
    try {
      const profile = await firstValueFrom(this.profileService.getProfile());
      this.profile.set({
        ...profile,
        isGoogleUser: profile.isGoogleUser ?? false,
        canEditEmail: profile.canEditEmail ?? true,
        membership: profile.membership ?? 'Premium Member',
        stats: profile.stats || undefined,
      });

      this.authService.updateUserProfile({
        name: profile.fullName,
        email: profile.email,
        image: profile.profileImage ?? undefined,
        preferredLanguage: profile.preferredLanguage,
      });

      this.loadFavoritesCount();

      // Fetch real orders from API
      try {
        const orders = await firstValueFrom(this.ordersApiService.getMyOrders());
        this.ordersCount.set(orders ? orders.length : 0);
        const recent = orders ? orders.slice(0, 3) : [];

        if (recent.length > 0) {
          const productIds: number[] = [];
          recent.forEach(order => {
            order.items.forEach(item => {
              if (item.productId) {
                productIds.push(Number(item.productId));
              }
            });
          });

          if (productIds.length > 0) {
            try {
              console.log('[Profile Debug] Fetching product details for IDs:', productIds);
              const products = await firstValueFrom(this.productCacheService.getProducts(productIds));
              console.log('[Profile Debug] Retrieved products:', products);
              const productMap = new Map<number, IProduct>();
              products.forEach(p => productMap.set(p.id, p));

              recent.forEach(order => {
                order.items.forEach(item => {
                  if (item.productId) {
                    const prod = productMap.get(Number(item.productId));
                    console.log(`[Profile Debug] Mapping item ${item.productId}:`, prod);
                    if (prod) {
                      item.productImage = prod.mainImageUrl || prod.imageUrl || undefined;
                      item.image = prod.mainImageUrl || prod.imageUrl || undefined;
                      console.log(`[Profile Debug] Set image to:`, item.productImage);
                    }
                  }
                });
              });
            } catch (err) {
              console.error('[Profile Debug] Failed to resolve order item images:', err);
            }
          }
        }

        console.log('[Profile Debug] Final recent orders list:', recent);
        this.recentOrders.set(recent);
      } catch {
        this.ordersCount.set(0);
        this.recentOrders.set([]);
      }

      // If stats section is already visible (counters already triggered with zeros),
      // re-run counters now that we have real data
      if (this.countersRan) {
        this.countersRan = false;
        this.runCounters();
        this.countersRan = true;
      }
    } catch (error) {
      if (!environment.production) {
        console.error('Error loading profile:', error);
      }

      let errorMessage = this.translationService.translate('PROFILE.PROFILE_LOAD_ERROR');
      if (error instanceof HttpErrorResponse) {
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const validationErrors = error.error.errors;
          const messages: string[] = [];
          for (const key in validationErrors) {
            if (validationErrors.hasOwnProperty(key)) {
              const fieldErrors = validationErrors[key];
              if (Array.isArray(fieldErrors)) {
                messages.push(...fieldErrors);
              } else {
                messages.push(String(fieldErrors));
              }
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          }
        }
      }
      this.uiState.showAlert('danger', errorMessage);
    } finally {
      this.loading.set(false);
    }
  }

  private loadFavoritesCount(): void {
    try {
      const raw = localStorage.getItem('furniture_favorites_list');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.favoritesCount.set(parsed.length);
        } else if (parsed && typeof parsed === 'object') {
          const items = parsed.items || [];
          this.favoritesCount.set(items.length);
        } else {
          this.favoritesCount.set(0);
        }
      } else {
        this.favoritesCount.set(0);
      }
    } catch {
      this.favoritesCount.set(0);
    }
  }

  trackByStat(_: number, stat: { labelKey: string }): string {
    return stat.labelKey;
  }

  async handleSaveProfile(payload: IUpdateProfileDto): Promise<void> {
    if (!this.profile()) {
      return;
    }

    this.formSubmitting.set(true);
    const requestPayload: IUpdateProfileDto = {
      ...payload,
      profileImage: this.profile()?.profileImage ?? null,
      addresses: this.profile()?.addresses ?? [],
    };

    try {
      const updated = await firstValueFrom(this.profileService.updateProfile(requestPayload));
      const profileUpdate = {
        ...updated,
        isGoogleUser: updated.isGoogleUser ?? this.profile()?.isGoogleUser ?? false,
        canEditEmail: updated.canEditEmail ?? this.profile()?.canEditEmail ?? true,
        membership: this.profile()?.membership ?? 'Premium Member',
        stats: this.profile()?.stats,
      } as IProfile;

      this.profile.set(profileUpdate);
      this.selectedImage.set(null);

      this.authService.updateUserProfile({
        name: updated.fullName,
        email: updated.email,
        image: updated.profileImage ?? undefined,
        preferredLanguage: updated.preferredLanguage,
      });

      if (requestPayload.preferredLanguage !== this.translationService.currentLang()) {
        await this.translationService.setLanguage(requestPayload.preferredLanguage);
      }

      this.uiState.showAlert('success', this.translationService.translate('PROFILE.SAVE_CHANGES'));
    } catch (error) {
      if (!environment.production) {
        console.error('Error saving profile:', error);
      }

      let errorMessage = this.translationService.translate('PROFILE.PROFILE_UPDATE_ERROR');
      if (error instanceof HttpErrorResponse) {
        if (typeof error.error === 'string' && error.error) {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const validationErrors = error.error.errors;
          const messages: string[] = [];
          for (const key in validationErrors) {
            if (validationErrors.hasOwnProperty(key)) {
              const fieldErrors = validationErrors[key];
              if (Array.isArray(fieldErrors)) {
                messages.push(...fieldErrors);
              } else {
                messages.push(String(fieldErrors));
              }
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          }
        }
      }
      this.uiState.showAlert('danger', errorMessage);
    } finally {
      this.formSubmitting.set(false);
    }
  }

  async handleUpdateAddresses(addresses: IAddressDto[]): Promise<void> {
    if (!this.profile()) {
      return;
    }

    this.formSubmitting.set(true);
    const currentProfile = this.profile()!;
    const requestPayload: IUpdateProfileDto = {
      fullName: currentProfile.fullName,
      userName: currentProfile.userName ?? null,
      email: currentProfile.email ?? null,
      phoneNumber: currentProfile.phoneNumber ?? null,
      preferredLanguage: currentProfile.preferredLanguage || 'en',
      profileImage: currentProfile.profileImage ?? null,
      addresses: addresses,
    };

    try {
      const updated = await firstValueFrom(this.profileService.updateProfile(requestPayload));
      this.profile.set({
        ...updated,
        isGoogleUser: updated.isGoogleUser ?? this.profile()?.isGoogleUser ?? false,
        canEditEmail: updated.canEditEmail ?? this.profile()?.canEditEmail ?? true,
        membership: this.profile()?.membership ?? 'Premium Member',
        stats: this.profile()?.stats,
      });

      this.authService.updateUserProfile({
        name: updated.fullName,
        email: updated.email,
        image: updated.profileImage ?? undefined,
        preferredLanguage: updated.preferredLanguage,
      });

      this.uiState.showAlert('success', this.translationService.translate('PROFILE.ADDRESSES_UPDATED'));
    } catch (error) {
      if (!environment.production) {
        console.error('Error updating addresses:', error);
      }

      let errorMessage = this.translationService.translate('PROFILE.ADDRESSES_UPDATE_ERROR');
      if (error instanceof HttpErrorResponse) {
        if (typeof error.error === 'string' && error.error) {
          errorMessage = error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const validationErrors = error.error.errors;
          const messages: string[] = [];
          for (const key in validationErrors) {
            if (validationErrors.hasOwnProperty(key)) {
              const fieldErrors = validationErrors[key];
              if (Array.isArray(fieldErrors)) {
                messages.push(...fieldErrors);
              } else {
                messages.push(String(fieldErrors));
              }
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          }
        }
      }
      this.uiState.showAlert('danger', errorMessage);
    } finally {
      this.formSubmitting.set(false);
    }
  }

  async handleAction(action: { labelKey: string; route: string }): Promise<void> {
    if (action.route === 'profile-addresses') {
      this.activeSection.set('addresses');
      setTimeout(() => this.scrollToAddresses(), 100);
      return;
    }
    if (action.route) {
      await this.router.navigate([action.route]);
      return;
    }

    this.uiState.showAlert('info', this.translationService.translate('PROFILE.FEATURE_COMING_SOON'));
  }

  private scrollToAddresses(): void {
    this.profileAddressesRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  scrollToProfileForm(): void {
    const el = document.querySelector('app-editable-profile-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const editBtn = el.querySelector('.btn-outline-edit') as HTMLButtonElement;
      if (editBtn) {
        const isEdit = el.querySelector('form')?.querySelector('input');
        if (!isEdit) {
          editBtn.click();
        }
      }
    }
  }

  async handleImageSelected(file: File): Promise<void> {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      this.uiState.showAlert('danger', this.translationService.translate('PROFILE.INVALID_FILE_TYPE'));
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.uiState.showAlert('danger', this.translationService.translate('PROFILE.FILE_TOO_LARGE'));
      return;
    }

    this.imageUploading.set(true);

    // Show local preview immediately while upload is in flight
    const preview = await this.readFileAsDataUrl(file);
    this.selectedImage.set(preview);

    try {
      // Upload to dedicated endpoint: PUT /Profile/image  (FormData, field name: "file")
      await firstValueFrom(this.profileService.uploadProfileImage(file));

      // Upload succeeded — refresh full profile from API to get the persisted image URL
      const updated = await firstValueFrom(this.profileService.getProfile());
      this.profile.set({
        ...updated,
        isGoogleUser: updated.isGoogleUser ?? this.profile()?.isGoogleUser ?? false,
        canEditEmail: updated.canEditEmail ?? this.profile()?.canEditEmail ?? true,
        membership: this.profile()?.membership ?? 'Premium Member',
        stats: this.profile()?.stats,
      });
      this.selectedImage.set(null);

      // Sync the navbar and all downstream avatar consumers
      this.authService.updateUserProfile({
        name: updated.fullName,
        email: updated.email,
        image: updated.profileImage ?? undefined,
      });

      this.uiState.showAlert('success', this.translationService.translate('PROFILE.IMAGE_UPLOAD_SUCCESS'));
    } catch (error) {
      // Upload failed — revert preview
      this.selectedImage.set(null);

      if (!environment.production) {
        console.error('Error uploading profile image:', error);
      }

      let errorMessage = this.translationService.translate('PROFILE.IMAGE_UPLOAD_ERROR');
      if (error instanceof HttpErrorResponse) {
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errors) {
          const validationErrors = error.error.errors;
          const messages: string[] = [];
          for (const key in validationErrors) {
            if (validationErrors.hasOwnProperty(key)) {
              const fieldErrors = validationErrors[key];
              if (Array.isArray(fieldErrors)) {
                messages.push(...fieldErrors);
              } else {
                messages.push(String(fieldErrors));
              }
            }
          }
          if (messages.length > 0) {
            errorMessage = messages.join(' ');
          }
        }
      }
      this.uiState.showAlert('danger', errorMessage);
    } finally {
      this.imageUploading.set(false);
    }
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onLogout(): void {
    this.authService.logout();
    void this.router.navigate([NAV_ROUTES.LOGIN]);
  }

  onCreateAiDesign(): void {
    void this.router.navigate([NAV_ROUTES.AI_CHAT]);
  }
}
