import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { IProfile } from '../../interfaces/iprofile';
import { IUpdateProfileDto } from '../../interfaces/iupdate-profile.dto';

@Component({
  selector: 'app-editable-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective],
  template: `
    <div appRtl class="profile-form-card card border-0 shadow-sm rounded-4 bg-white">
      <div class="card-body p-4">
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="row g-3">
          <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mb-4 col-12">
            <div>
              <h3 class="h5 mb-1">{{ 'PROFILE.PERSONAL_INFORMATION' | translate }}</h3>
              <p class="text-muted mb-0">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</p>
            </div>
            <button type="button" class="btn btn-outline-primary rounded-pill" (click)="toggleEditMode()">
              {{ isEditMode() ? ('PROFILE.CANCEL' | translate) : ('PROFILE.EDIT' | translate) }}
            </button>
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label" for="fullName">{{ 'PROFILE.FULL_NAME' | translate }}</label>
            <input id="fullName" class="form-control" type="text" formControlName="fullName" [readonly]="!isEditMode()" />
            <div class="invalid-feedback d-block" *ngIf="fullName.invalid && fullName.touched">
              {{ 'PROFILE.FULL_NAME' | translate }} is required.
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label" for="userName">{{ 'PROFILE.USERNAME' | translate }}</label>
            <input id="userName" class="form-control" type="text" formControlName="userName" [readonly]="!isEditMode()" />
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label" for="email">{{ 'PROFILE.EMAIL' | translate }}</label>
            <input id="email" class="form-control" type="email" formControlName="email" [readonly]="!isEditMode()" />
            <div class="invalid-feedback d-block" *ngIf="email.invalid && email.touched">
              <ng-container *ngIf="email.hasError('required')">
                {{ 'PROFILE.EMAIL_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="email.hasError('email')">
                {{ 'PROFILE.EMAIL_INVALID' | translate }}
              </ng-container>
            </div>
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label" for="phoneNumber">{{ 'PROFILE.PHONE' | translate }}</label>
            <input id="phoneNumber" class="form-control" type="tel" formControlName="phoneNumber" [readonly]="!isEditMode()" />
          </div>

          <div class="col-12 col-lg-6">
            <label class="form-label" for="preferredLanguage">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</label>
            <select id="preferredLanguage" class="form-select" formControlName="preferredLanguage" [disabled]="!isEditMode()">
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          <div class="col-12">
            <button
              type="submit"
              class="btn btn-primary rounded-pill px-4"
              [disabled]="submitting || !isEditMode()">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ 'PROFILE.SAVE_CHANGES' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-form-card {
        min-height: 100%;
      }
      .invalid-feedback {
        font-size: 0.85rem;
      }
    `
  ]
})
export class EditableProfileForm implements OnChanges {
  @Input() profile: IProfile | null = null;
  @Input() submitting = false;
  @Output() saveProfile = new EventEmitter<IUpdateProfileDto>();

  readonly isEditMode = signal(false);
  private formBuilder = new FormBuilder();

  readonly profileForm = this.formBuilder.group({
    fullName: ['', [Validators.required]],
    userName: ['', []],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', []],
    preferredLanguage: ['en', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && this.profile) {
      this.profileForm.patchValue({
        fullName: this.profile.fullName,
        userName: this.profile.userName ?? '',
        email: this.profile.email,
        phoneNumber: this.profile.phoneNumber ?? '',
        preferredLanguage: this.profile.preferredLanguage ?? 'en',
      });
    }
  }

  get fullName() {
    return this.profileForm.get('fullName')!;
  }

  get email() {
    return this.profileForm.get('email')!;
  }

  toggleEditMode(): void {
    this.isEditMode.update((value) => !value);
    if (!this.isEditMode()) {
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      if (this.profile) {
        this.profileForm.patchValue({
          fullName: this.profile.fullName,
          userName: this.profile.userName ?? '',
          email: this.profile.email,
          phoneNumber: this.profile.phoneNumber ?? '',
          preferredLanguage: this.profile.preferredLanguage ?? 'en',
        });
      }
    }
  }

  onSubmit(): void {
    if (!this.isEditMode() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload: IUpdateProfileDto = {
      fullName: this.fullName.value as string,
      userName: this.profileForm.get('userName')?.value || null,
      email: this.email.value as string | null,
      phoneNumber: this.profileForm.get('phoneNumber')?.value || null,
      preferredLanguage: this.profileForm.get('preferredLanguage')?.value as 'en' | 'ar',
      profileImage: this.profile?.profileImage ?? null,
      addresses: this.profile?.addresses ?? [],
    };

    this.saveProfile.emit(payload);
  }
}
