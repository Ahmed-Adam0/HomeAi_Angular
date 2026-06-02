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
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { IVendorProfile } from '../../interfaces/iworkshop-profile';

@Component({
  selector: 'app-workshop-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective],
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
  readonly editing = input(false);

  readonly saveProfile = output<IVendorProfile>();
  readonly uploadLogo = output<File>();
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

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    console.log(file.name);
    console.log(file.type);

    if (!this.ALLOWED_MIME_TYPES.includes(file.type)) {
      this.logoError.set('vendor.profile.error.invalidImageType');
      input.value = '';
      return;
    }

    this.logoError.set(null);
    this.uploadLogo.emit(file);
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
    this.submitted.set(false);
    this.cancelEdit.emit();
  }
}
