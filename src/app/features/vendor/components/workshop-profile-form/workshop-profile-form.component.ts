import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { IVendorProfile } from '../../interfaces/iworkshop-profile';

@Component({
  selector: 'app-workshop-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective, AutoDirectionDirective],
  templateUrl: './workshop-profile-form.component.html',
  styleUrl: './workshop-profile-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopProfileForm {
  private readonly fb = inject(FormBuilder);

  readonly profile = input<IVendorProfile | null>(null);
  readonly loading = input(false);
  readonly saving = input(false);
  readonly uploadingLogo = input(false);
  readonly uploadingAvatar = input(false);
  readonly editing = input(false);

  readonly saveProfile = output<IVendorProfile>();
  readonly uploadLogo = output<File>();
  readonly uploadAvatar = output<File>();
  readonly editProfile = output<void>();
  readonly cancelEdit = output<void>();

  protected readonly submitted = signal(false);

  protected readonly workshopDisplayName = computed(() => {
    const p = this.profile();
    return p?.workshopNameEn || p?.workshopNameAr || p?.fullName || '--';
  });

  protected readonly languageLabel = computed(() => {
    const lang = this.profile()?.preferredLanguage;
    return lang === 'ar' ? 'العربية' : 'English';
  });

  protected readonly form = this.fb.nonNullable.group({
    fullName: this.fb.nonNullable.control<string>('', {
      validators: [Validators.required],
    }),
    phoneNumber: this.fb.nonNullable.control<string>('', {
      validators: [Validators.required, phoneValidator()],
    }),
    email: this.fb.nonNullable.control<string>('', {
      validators: [Validators.required, Validators.email],
    }),
    preferredLanguage: this.fb.nonNullable.control<string>('en', {
      validators: [Validators.required],
    }),
    workshopNameAr: this.fb.nonNullable.control<string>(''),
    workshopNameEn: this.fb.nonNullable.control<string>(''),
    descriptionAr: this.fb.nonNullable.control<string>(''),
    descriptionEn: this.fb.nonNullable.control<string>(''),
    workshopAddress: this.fb.nonNullable.group({
      city: this.fb.nonNullable.control<string>(''),
      area: this.fb.nonNullable.control<string>(''),
      street: this.fb.nonNullable.control<string>(''),
      buildingNumber: this.fb.nonNullable.control<string>(''),
      notes: this.fb.nonNullable.control<string>(''),
    }),
  });

  protected readonly isSkeletonVisible = computed(
    () => this.loading() && !this.profile()
  );

  protected readonly pendingAvatarFile = signal<File | null>(null);
  protected readonly pendingAvatarPreview = signal<string | null>(null);
  protected readonly pendingLogoFile = signal<File | null>(null);
  protected readonly pendingLogoPreview = signal<string | null>(null);

  protected readonly hasPendingAvatar = computed(() => this.pendingAvatarFile() !== null);
  protected readonly hasPendingLogo = computed(() => this.pendingLogoFile() !== null);

  constructor() {
    effect(() => {
      const profile = this.profile();
      const isEditing = this.editing();

      if (profile && isEditing) {
        this.form.patchValue({
          fullName: profile.fullName ?? '',
          phoneNumber: profile.phoneNumber ?? '',
          email: profile.email ?? '',
          preferredLanguage: profile.preferredLanguage,
          workshopNameAr: profile.workshopNameAr ?? '',
          workshopNameEn: profile.workshopNameEn ?? '',
          descriptionAr: profile.descriptionAr ?? '',
          descriptionEn: profile.descriptionEn ?? '',
          workshopAddress: {
            city: profile.workshopAddress.city ?? '',
            area: profile.workshopAddress.area ?? '',
            street: profile.workshopAddress.street ?? '',
            buildingNumber: profile.workshopAddress.buildingNumber ?? '',
            notes: profile.workshopAddress.notes ?? '',
          },
        });
      }

      if (!isEditing) {
        this.submitted.set(false);
      }
    });

    effect(() => {
      this.profile();
      this.cancelPendingAvatar();
      this.cancelPendingLogo();
    });
  }

  protected onToggleEdit(): void {
    if (this.editing()) {
      this.onCancel();
    } else {
      this.editProfile.emit();
    }
  }

  private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  protected readonly logoError = signal<string | null>(null);
  protected readonly avatarError = signal<string | null>(null);

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      this.logoError.set('vendor.profile.error.invalidImageType');
      input.value = '';
      return;
    }

    this.logoError.set(null);

    const preview = await this.readFileAsDataUrl(file);
    this.pendingLogoFile.set(file);
    this.pendingLogoPreview.set(preview);
    input.value = '';
  }

  protected async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      this.avatarError.set('vendor.profile.error.invalidImageType');
      input.value = '';
      return;
    }

    this.avatarError.set(null);

    const preview = await this.readFileAsDataUrl(file);
    this.pendingAvatarFile.set(file);
    this.pendingAvatarPreview.set(preview);
    input.value = '';
  }

  protected onSaveAvatar(): void {
    const file = this.pendingAvatarFile();
    if (!file) return;

    this.pendingAvatarFile.set(null);
    this.pendingAvatarPreview.set(null);
    this.uploadAvatar.emit(file);
  }

  protected onCancelAvatar(): void {
    this.cancelPendingAvatar();
  }

  protected onSaveLogo(): void {
    const file = this.pendingLogoFile();
    if (!file) return;

    this.pendingLogoFile.set(null);
    this.pendingLogoPreview.set(null);
    this.uploadLogo.emit(file);
  }

  protected onCancelLogo(): void {
    this.cancelPendingLogo();
  }

  private cancelPendingAvatar(): void {
    this.pendingAvatarFile.set(null);
    this.pendingAvatarPreview.set(null);
  }

  private cancelPendingLogo(): void {
    this.pendingLogoFile.set(null);
    this.pendingLogoPreview.set(null);
  }

  protected onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    const profile: IVendorProfile = {
      fullName: raw.fullName || null,
      phoneNumber: raw.phoneNumber || null,
      email: raw.email || null,
      preferredLanguage: raw.preferredLanguage,
      workshopNameAr: raw.workshopNameAr || null,
      workshopNameEn: raw.workshopNameEn || null,
      descriptionAr: raw.descriptionAr || null,
      descriptionEn: raw.descriptionEn || null,
      workshopAddress: {
        city: raw.workshopAddress.city || null,
        area: raw.workshopAddress.area || null,
        street: raw.workshopAddress.street || null,
        buildingNumber: raw.workshopAddress.buildingNumber || null,
        notes: raw.workshopAddress.notes || null,
      },
    };

    this.saveProfile.emit(profile);
  }

  protected onCancel(): void {
    this.cancelPendingAvatar();
    this.cancelPendingLogo();
    this.submitted.set(false);
    this.cancelEdit.emit();
  }
}
