import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { WorkshopProfileForm } from '../../components';
import { IVendorProfile } from '../../interfaces';
import { VendorService } from '../../services/vendor.service';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-vendor-workshop-profile',
  standalone: true,
  imports: [WorkshopProfileForm, TranslatePipe, RtlDirective],
  templateUrl: './vendor-workshop-profile.component.html',
  styleUrl: './vendor-workshop-profile.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorWorkshopProfile implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly uiState = inject(UiState);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profile = signal<IVendorProfile | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploadingLogo = signal(false);
  protected readonly isEditing = signal(false);

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.loading.set(true);

    this.vendorService
      .getWorkshopProfile()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: (err: HttpErrorResponse) => {
          console.error('[VendorWorkshopProfile] Failed to load profile:', err);
          this.uiState.showAlert('danger', 'vendor.profile.error.loadFailed');
        },
      });
  }

  protected editProfile(): void {
    this.isEditing.set(true);
  }

  protected cancelEdit(): void {
    this.isEditing.set(false);
  }

  protected onSaveProfile(profileData: IVendorProfile): void {
    this.saving.set(true);

    this.vendorService
      .updateWorkshopProfile(profileData)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.isEditing.set(false);
          this.uiState.showAlert('success', 'vendor.profile.success.updated');
        },
        error: (err: HttpErrorResponse) => {
          console.error('[VendorWorkshopProfile] Failed to save profile:', err);
          this.uiState.showAlert('danger', 'vendor.profile.error.saveFailed');
        },
      });
  }

  protected onUploadLogo(file: File): void {
    this.uploadingLogo.set(true);

    this.vendorService
      .uploadWorkshopLogo(file)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.uploadingLogo.set(false)),
      )
      .subscribe({
        next: () => {
          this.loadProfile();
          this.uiState.showAlert('success', 'vendor.profile.success.logoUpdated');
        },
        error: (err: HttpErrorResponse) => {
          console.error('[VendorWorkshopProfile] Failed to upload logo:', err);
          this.uiState.showAlert('danger', 'vendor.profile.error.logoUploadFailed');
        },
      });
  }
}
