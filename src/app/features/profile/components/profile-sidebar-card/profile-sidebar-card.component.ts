import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IProfile } from '../../interfaces/iprofile';
import { ProfileStatItem } from '../profile-stat-item/profile-stat-item.component';

@Component({
  selector: 'app-profile-sidebar-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe, ProfileStatItem],
  template: `
    <div class="sidebar-card card border-0 shadow-sm rounded-4 overflow-hidden">
      <div class="card-body p-4 bg-white">
        <div class="avatar-shell position-relative mb-4 text-center">
          <div class="avatar-circle bg-light border border-2 border-white shadow-sm mx-auto">
            <ng-container *ngIf="avatarPreview; else initialsIcon">
              <img [src]="avatarPreview" alt="avatar preview" class="avatar-img rounded-circle" />
            </ng-container>
            <ng-template #initialsIcon>
              <span class="avatar-initials">{{ initials }}</span>
            </ng-template>
          </div>
          <label class="upload-overlay btn btn-sm btn-outline-primary position-absolute bottom-0 start-50 translate-middle-x">
            {{ 'PROFILE.EDIT' | translate }}
            <input type="file" accept="image/*" hidden (change)="onFileChange($event)" />
          </label>
        </div>

        <div class="text-center mb-4">
          <h2 class="h5 mb-1 text-dark">{{ profile?.fullName || profile?.userName || 'FurniMind AI' }}</h2>
          <p class="mb-0 text-muted">{{ profile?.email }}</p>
          <span class="badge rounded-pill bg-secondary mt-3">{{ profile?.membership || ('PROFILE.MEMBERSHIP' | translate) }}</span>
        </div>

        <div class="row row-cols-2 g-3 mt-4">
          <div class="col" *ngFor="let stat of stats; trackBy: trackByStat">
            <app-profile-stat-item [labelKey]="stat.labelKey" [value]="stat.value"></app-profile-stat-item>
          </div>
        </div>

        <div class="mt-4 d-flex flex-column gap-3">
          <button type="button" class="btn btn-primary btn-lg rounded-pill" (click)="createAiDesign.emit()">
            {{ 'PROFILE.CREATE_AI_DESIGN' | translate }}
          </button>
          <button type="button" class="btn btn-outline-danger rounded-pill" (click)="logout.emit()">
            {{ 'PROFILE.LOGOUT' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .avatar-shell {
        width: 100%;
      }
      .avatar-circle {
        width: 132px;
        height: 132px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        position: relative;
      }
      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar-initials {
        font-size: 2rem;
        font-weight: 700;
        color: #1f1f1f;
      }
      .upload-overlay {
        cursor: pointer;
      }
      :host-context([dir='rtl']) .upload-overlay {
        right: auto;
        left: 50%;
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
