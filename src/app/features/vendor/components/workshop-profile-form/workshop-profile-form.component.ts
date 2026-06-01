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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { IVendorProfile } from '../../interfaces/iworkshop-profile';

@Component({
  selector: 'app-workshop-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
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

  protected onEditProfile(): void {
    this.editProfile.emit();
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

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.uploadLogo.emit(file);
    }
  }
}
