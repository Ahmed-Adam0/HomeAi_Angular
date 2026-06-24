import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IProfile } from '../../interfaces/iprofile';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';


@Component({
  selector: 'app-profile-sidebar-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, LazyImageDirective],
  template: `
    <div class="sidebar-card card border-0 overflow-hidden sticky-xl-top">
      <div class="card-body p-4 p-md-5 d-flex flex-column align-items-center">
        <!-- Avatar Section -->
        <div class="avatar-container position-relative mb-4">
          <div class="avatar-circle-wrapper bg-white shadow-sm border border-2 border-white">
            <ng-container *ngIf="avatarPreview; else initialsIcon">
              <img [appLazyImage]="avatarPreview" alt="avatar preview" class="avatar-img rounded-circle" />
            </ng-container>
            <ng-template #initialsIcon>
              <span class="avatar-initials">{{ initials }}</span>
            </ng-template>
          </div>
          <!-- Upload Camera Badge -->
          <label class="camera-upload-badge shadow-md d-flex align-items-center justify-content-center position-absolute"
                 [class.cursor-pointer]="!uploading" [class.cursor-not-allowed]="uploading">
            @if (uploading) {
              <span class="spinner-border spinner-border-sm text-white"></span>
            } @else {
              <i class="bi bi-camera-fill"></i>
            }
            <input type="file" accept="image/*" hidden (change)="onFileChange($event)" [disabled]="uploading" />
          </label>
        </div>

        <!-- Name & Email Info -->
        <div class="text-center mb-3">
          <div class="d-flex align-items-center justify-content-center gap-2 mb-1 flex-wrap">
            <h2 class="h5 mb-0 text-dark font-bold tracking-tight">{{ profile?.fullName || profile?.userName || 'FurniMind AI' }}</h2>
            <span class="verify-badge d-flex align-items-center justify-content-center" title="Verified Member">
              <i class="bi bi-patch-check-fill text-brand"></i>
            </span>
          </div>
          <p class="mb-1 text-muted small text-truncate" style="max-width: 250px; font-weight: 500;">{{ profile?.email }}</p>
          <p class="mb-0 text-muted small" *ngIf="profile?.phoneNumber" style="font-weight: 500;">
            <i class="bi bi-telephone-fill me-1.5 text-muted opacity-60"></i>{{ profile?.phoneNumber }}
          </p>
          <div class="d-flex align-items-center justify-content-center gap-2 mt-3 flex-wrap">
            <span class="membership-badge">{{ profile?.membership || ('PROFILE.MEMBERSHIP' | translate) }}</span>
            <span class="member-since-badge">{{ 'PROFILE.ESTABLISHED' | translate }}</span>
          </div>
        </div>

        <!-- Stats Horizontal Summary (Orders, Designs, Saved) -->
        <div class="stats-container w-100 d-flex justify-content-around py-3 px-2 rounded-4 my-3">
          <div class="stat-block text-center flex-grow-1" *ngFor="let stat of stats; trackBy: trackByStat; let last = last" [class.border-end]="!last">
            <div class="stat-value display-6 font-bold text-dark mb-1">{{ stat.value }}</div>
            <div class="stat-label text-muted text-uppercase" style="font-size: 0.65rem; letter-spacing: 0.05em;">{{ stat.labelKey | translate }}</div>
          </div>
        </div>

        <!-- Sign Out Action -->
        <button type="button" class="btn btn-outline-logout w-100 rounded-pill btn-md d-flex align-items-center justify-content-center gap-2 mt-4" (click)="logout.emit()">
          <i class="bi bi-box-arrow-right"></i>
          {{ 'PROFILE.LOGOUT' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .sidebar-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.6) 100%);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
        transition: var(--fm-transition-smooth);
        position: relative;
      }
      .sidebar-card::before {
        content: '';
        position: absolute;
        top: 0;
        inset-inline-start: 0;
        inset-inline-end: 0;
        height: 6px;
        background: linear-gradient(90deg, var(--fm-color-primary-300), var(--fm-color-primary-500), var(--fm-color-primary-700));
      }
      .sidebar-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 30px 60px rgba(184, 147, 92, 0.08) !important;
        border-color: rgba(184, 147, 92, 0.25) !important;
      }
      .sticky-xl-top {
        top: 2rem;
        z-index: 10;
      }
      .avatar-container {
        width: 120px;
        height: 120px;
        transition: var(--fm-transition-smooth);
      }
      .avatar-container:hover {
        transform: scale(1.04);
      }
      .avatar-circle-wrapper {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: linear-gradient(135deg, var(--fm-color-primary-50), var(--fm-color-primary-100));
        border: 3px solid #ffffff !important;
        box-shadow: 0 0 0 3px rgba(184, 147, 92, 0.15), var(--fm-shadow-md);
        transition: var(--fm-transition-smooth);
      }
      .avatar-container:hover .avatar-circle-wrapper {
        box-shadow: 0 0 0 5px rgba(184, 147, 92, 0.25), var(--fm-shadow-lg);
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-initials {
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--fm-color-primary-800);
        font-family: var(--fm-font-display);
        letter-spacing: -0.03em;
      }
      .camera-upload-badge {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--fm-color-neutral-900);
        color: #ffffff;
        bottom: 0;
        inset-inline-end: 0;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 2px solid #ffffff;
        box-shadow: var(--fm-shadow-md);
      }
      .camera-upload-badge:hover:not(.cursor-not-allowed) {
        background-color: var(--fm-color-primary-500);
        transform: scale(1.1) rotate(15deg);
        box-shadow: var(--fm-shadow-hover);
      }
      .cursor-not-allowed {
        cursor: not-allowed !important;
        opacity: 0.7;
      }
      .verify-badge {
        font-size: 1.15rem;
        animation: pulseBadge 2.5s infinite;
      }
      @keyframes pulseBadge {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); filter: drop-shadow(0 0 2px rgba(184,147,92,0.4)); }
      }
      .membership-badge {
        background: linear-gradient(135deg, var(--fm-color-primary-50) 0%, var(--fm-color-primary-100) 100%);
        color: var(--fm-color-primary-700);
        font-weight: 600;
        font-size: 0.72rem;
        padding: 4px 14px;
        border-radius: var(--fm-radius-pill);
        border: 1px solid rgba(184, 147, 92, 0.2);
        letter-spacing: 0.02em;
      }
      .member-since-badge {
        background-color: var(--fm-color-neutral-100);
        color: var(--fm-color-neutral-600);
        font-weight: 500;
        font-size: 0.72rem;
        padding: 4px 12px;
        border-radius: var(--fm-radius-pill);
        border: 1px solid var(--fm-color-neutral-200);
      }
      .stats-container {
        background-color: rgba(184, 147, 92, 0.03);
        border: 1px solid rgba(184, 147, 92, 0.06);
        box-shadow: inset 0 1px 2px rgba(184, 147, 92, 0.02);
      }
      .stat-block {
        border-color: rgba(184, 147, 92, 0.08) !important;
      }
      .stat-value {
        font-size: 1.5rem !important;
        letter-spacing: -0.02em;
        font-family: var(--fm-font-display);
        color: var(--fm-color-neutral-800) !important;
      }
      .stat-label {
        font-weight: 600;
      }
      .btn-outline-logout {
        border: 1px solid rgba(220, 53, 69, 0.25);
        background-color: rgba(220, 53, 69, 0.02);
        color: #dc3545;
        font-weight: 600;
        font-size: 0.9rem;
        transition: var(--fm-transition-smooth);
      }
      .btn-outline-logout:hover {
        background-color: #dc3545;
        border-color: #dc3545;
        color: #ffffff !important;
        box-shadow: 0 8px 20px rgba(220, 53, 69, 0.2);
        transform: translateY(-2px);
      }
      .btn-outline-logout:active {
        transform: translateY(0);
      }
    `
  ]
})
export class ProfileSidebarCard {
  @Input() profile: IProfile | null = null;
  @Input() avatarPreview: string | null = null;
  @Input() stats: readonly { labelKey: string; value: number }[] = [];
  @Input() uploading = false;
  @Output() logout = new EventEmitter<void>();
  @Output() createAiDesign = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File>();

  get initials(): string {
    const name = this.profile?.fullName || this.profile?.userName || 'FM';
    return name
      .split(' ')
      .map((segment) => segment.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.fileSelected.emit(file);
    input.value = '';
  }

  trackByStat(_: number, item: { labelKey: string; value: number }): string {
    return item.labelKey;
  }
}
