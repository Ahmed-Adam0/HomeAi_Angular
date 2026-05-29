import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IProfile } from '../../interfaces/iprofile';

@Component({
  selector: 'app-profile-info-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="info-card card border-0 shadow-sm rounded-4 bg-white">
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
          <div>
            <h2 class="h5 mb-1">{{ 'PROFILE.TITLE' | translate }}</h2>
            <p class="text-muted mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
          </div>
          <span class="badge bg-soft-primary text-primary rounded-pill py-2 px-3">{{ profile?.preferredLanguage?.toUpperCase() || 'EN' }}</span>
        </div>

        <div class="row g-3">
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.FULL_NAME' | translate }}</div>
            <div class="fw-semibold">{{ profile?.fullName }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.EMAIL' | translate }}</div>
            <div class="fw-semibold">{{ profile?.email }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.PHONE' | translate }}</div>
            <div class="fw-semibold">{{ profile?.phoneNumber || '-' }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.MEMBERSHIP' | translate }}</div>
            <div class="fw-semibold">{{ profile?.membership || ('PROFILE.MEMBERSHIP' | translate) }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</div>
            <div class="fw-semibold">{{ profile?.preferredLanguage === 'ar' ? 'العربية' : 'English' }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-muted small mb-1">{{ 'PROFILE.ADDRESS' | translate }}</div>
            <div class="fw-semibold">{{ profile?.addresses?.length ?? 0 }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .info-card {
        min-height: 100%;
      }
      .bg-soft-primary {
        background-color: rgba(13, 110, 253, 0.1);
      }
    `
  ]
})
export class ProfileInfoCard {
  @Input() profile: IProfile | null = null;
}
