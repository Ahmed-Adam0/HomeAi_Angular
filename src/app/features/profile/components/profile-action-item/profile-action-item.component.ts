import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-profile-action-item',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <button type="button" class="action-item btn btn-light w-100 rounded-4 text-start d-flex align-items-center justify-content-between px-3 py-3">
      <span>{{ labelKey | translate }}</span>
      <span class="text-muted">›</span>
    </button>
  `,
  styles: [
    `
      .action-item {
        box-shadow: inset 0 0 0 1px rgba(31, 41, 55, 0.08);
        border: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .action-item:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 30px rgba(31, 41, 55, 0.08);
      }
    `
  ]
})
export class ProfileActionItem {
  @Input() labelKey = '';
}
