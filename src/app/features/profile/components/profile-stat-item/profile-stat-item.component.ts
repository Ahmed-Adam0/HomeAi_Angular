import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-stat-item',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="profile-stat-item p-3 rounded-3 bg-white shadow-sm text-center">
      <div class="stat-value display-6 fw-semibold">{{ value }}</div>
      <div class="stat-label text-uppercase text-muted small">{{ labelKey | translate }}</div>
    </div>
  `,
  styles: [
    `
      .profile-stat-item {
        min-width: 110px;
      }
      .stat-value {
        letter-spacing: 0.04em;
      }
    `
  ]
})
export class ProfileStatItem {
  @Input() labelKey = '';
  @Input() value = 0;
}
