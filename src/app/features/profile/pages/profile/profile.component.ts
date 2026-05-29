import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { ProfileSidebarCard } from '../../components/profile-sidebar-card/profile-sidebar-card.component';
import { ProfileInfoCard } from '../../components/profile-info-card/profile-info-card.component';
import { ProfileSettingsCard } from '../../components/profile-settings-card/profile-settings-card.component';
import { EditableProfileForm } from '../../components/editable-profile-form/editable-profile-form.component';
import { ChangePasswordForm } from '../../components/change-password-form/change-password-form.component';
import { IProfile } from '../../interfaces/iprofile';
import { IUpdateProfileDto } from '../../interfaces/iupdate-profile.dto';
import { NAV_ROUTES } from '../../../../core/constants/app-routes';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    RtlDirective,
    ProfileSidebarCard,
    ProfileInfoCard,
    ProfileSettingsCard,
    EditableProfileForm,
    ChangePasswordForm,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class Profile {
  private readonly profileService = inject(ProfileService);
  private readonly translationService = inject(TranslationService);
  private readonly uiState = inject(UiState);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly profile = signal<IProfile | null>(null);
  readonly loading = signal(true);
  readonly formSubmitting = signal(false);
  readonly selectedImage = signal<string | null>(null);

  readonly profilePreview = computed(() => this.selectedImage() ?? this.profile()?.profileImage ?? null);

  readonly actionItems: readonly { labelKey: string; route: string }[] = [
    { labelKey: 'PROFILE.MY_ORDERS', route: NAV_ROUTES.ORDERS },
    { labelKey: 'PROFILE.FAVORITES', route: NAV_ROUTES.FAVORITES },
    { labelKey: 'PROFILE.ADDRESS', route: NAV_ROUTES.ADDRESSES },
    { labelKey: 'PROFILE.NOTIFICATIONS', route: '/notifications' },
    { labelKey: 'PROFILE.PRIVACY', route: '' },
    { labelKey: 'PROFILE.DESIGN_PREFERENCES', route: '' },
  ];

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
  }

  private async loadProfile(): Promise<void> {
    this.loading.set(true);
    try {
      const profile = await firstValueFrom(this.profileService.getProfile());
      this.profile.set({
        ...profile,
        membership: profile.membership ?? 'Premium Member',
        stats: profile.stats ?? {
          roomsDesigned: 14,
          productsViewed: 92,
          recommendations: 18,
          stylesExplored: 6,
        },
      });
    } catch (error) {
      this.uiState.showAlert('danger', this.translationService.translate('PROFILE.PROFILE_LOAD_ERROR'));
    } finally {
      this.loading.set(false);
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
      profileImage: this.selectedImage() ?? this.profile()?.profileImage ?? null,
      addresses: this.profile()?.addresses ?? [],
    };

    try {
      const updated = await firstValueFrom(this.profileService.updateProfile(requestPayload));
      const profileUpdate = {
        ...updated,
        membership: this.profile()?.membership ?? 'Premium Member',
        stats: this.profile()?.stats ?? this.profile()?.stats,
      } as IProfile;

      this.profile.set(profileUpdate);
      this.selectedImage.set(null);

      if (requestPayload.preferredLanguage !== this.translationService.currentLang()) {
        await this.translationService.setLanguage(requestPayload.preferredLanguage);
      }

      this.uiState.showAlert('success', this.translationService.translate('PROFILE.SAVE_CHANGES'));
    } catch (error) {
      this.uiState.showAlert('danger', this.translationService.translate('PROFILE.PROFILE_UPDATE_ERROR'));
    } finally {
      this.formSubmitting.set(false);
    }
  }

  async handleAction(action: { labelKey: string; route: string }): Promise<void> {
    if (action.route) {
      await this.router.navigate([action.route]);
      return;
    }

    this.uiState.showAlert('info', this.translationService.translate('PROFILE.FEATURE_COMING_SOON'));
  }

  async handleImageSelected(file: File): Promise<void> {
    const preview = await this.readFileAsDataUrl(file);
    this.selectedImage.set(preview);
    this.profile.update((current) => current ? { ...current, profileImage: preview } : current);
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
