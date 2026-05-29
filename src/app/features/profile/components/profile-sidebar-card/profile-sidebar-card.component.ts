import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IProfile } from '../../interfaces/iprofile';

@Component({
  selector: 'app-profile-sidebar-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="sidebar-card card border-0 overflow-hidden sticky-xl-top">
      <div class="card-body p-4 p-md-5 d-flex flex-column align-items-center">
        <!-- Avatar Section -->
        <div class="avatar-container position-relative mb-4">
          <div class="avatar-circle-wrapper bg-white shadow-sm border border-2 border-white">
            <ng-container *ngIf="avatarPreview; else initialsIcon">
              <img [src]="avatarPreview" alt="avatar preview" class="avatar-img rounded-circle" />
            </ng-container>
            <ng-template #initialsIcon>
              <span class="avatar-initials">{{ initials }}</span>
            </ng-template>
          </div>
          <!-- Upload Camera Badge -->
          <label class="camera-upload-badge shadow-md d-flex align-items-center justify-content-center cursor-pointer position-absolute">
            <i class="bi bi-camera-fill"></i>
            <input type="file" accept="image/*" hidden (change)="onFileChange($event)" />
          </label>
        </div>

        <!-- Name & Email Info -->
        <div class="text-center mb-3">
          <h2 class="h5 mb-1 text-dark font-semibold">{{ profile?.fullName || profile?.userName || 'FurniMind AI' }}</h2>
          <p class="mb-0 text-muted small text-truncate" style="max-width: 250px;">{{ profile?.email }}</p>
          <span class="membership-badge mt-3 d-inline-block">{{ profile?.membership || ('PROFILE.MEMBERSHIP' | translate) }}</span>
        </div>

        <!-- Stats Horizontal Summary (Orders, Designs, Saved) -->
        <div class="stats-container w-100 d-flex justify-content-around py-3 px-2 rounded-4 my-3">
          <div class="stat-block text-center flex-grow-1" *ngFor="let stat of stats; trackBy: trackByStat; let last = last" [class.border-end]="!last">
            <div class="stat-value display-6 font-bold text-dark mb-1">{{ stat.value }}</div>
            <div class="stat-label text-muted text-uppercase" style="font-size: 0.65rem; letter-spacing: 0.05em;">{{ stat.labelKey | translate }}</div>
          </div>
        </div>

        <!-- Sign Out Action -->
        <button type="button" class="btn btn-outline-danger w-100 rounded-pill btn-md d-flex align-items-center justify-content-center gap-2 mt-4" (click)="logout.emit()">
          <i class="bi bi-box-arrow-right"></i>
          {{ 'PROFILE.LOGOUT' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .sidebar-card {
        background: var(--fm-glass-bg);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
        transition: var(--fm-transition-smooth);
      }
      .sticky-xl-top {
        top: 2rem;
        z-index: 10;
      }
      .avatar-container {
        width: 120px;
        height: 120px;
      }
      .avatar-circle-wrapper {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        display: grid;
        place-items: center;
        overflow: hidden;
        background-color: var(--fm-color-neutral-100);
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-initials {
        font-size: 2.25rem;
        font-weight: 700;
        color: var(--fm-color-neutral-800);
        font-family: var(--fm-font-display);
      }
      .camera-upload-badge {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--fm-color-neutral-900);
        color: #ffffff;
        bottom: 0;
        right: 0;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 2px solid #ffffff;
      }
      .camera-upload-badge:hover {
        background-color: var(--fm-color-primary-500);
        transform: scale(1.1);
        box-shadow: var(--fm-shadow-hover);
      }
      :host-context([dir='rtl']) .camera-upload-badge {
        right: auto;
        left: 0;
      }
      .membership-badge {
        background-color: var(--fm-color-primary-soft);
        color: var(--fm-color-primary-700);
        font-weight: 600;
        font-size: 0.75rem;
        padding: 4px 12px;
        border-radius: var(--fm-radius-pill);
      }
      .stats-container {
        background-color: rgba(31, 28, 24, 0.02);
        border: 1px solid rgba(31, 28, 24, 0.04);
      }
      .stat-block {
        border-color: rgba(31, 28, 24, 0.08) !important;
      }
      .stat-value {
        font-size: 1.5rem !important;
        letter-spacing: -0.02em;
        font-family: var(--fm-font-sans);
      }
      .btn-outline-danger {
        border-color: rgba(173, 92, 81, 0.2);
        background-color: rgba(173, 92, 81, 0.02);
        color: var(--fm-color-danger-500);
        font-weight: 500;
      }
      .btn-outline-danger:hover {
        background-color: var(--fm-color-danger-500);
        border-color: var(--fm-color-danger-500);
        color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(173, 92, 81, 0.15);
      }
    `
  ]
})
export class ProfileSidebarCard {
  @Input() profile: IProfile | null = null;
  @Input() avatarPreview: string | null = null;
  @Input() stats: readonly { labelKey: string; value: number }[] = [];
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
