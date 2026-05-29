import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

export interface IActionItem {
  labelKey: string;
  route: string;
  iconClass?: string;
  badgeValue?: number;
  iconBg?: string;
  iconColor?: string;
}

@Component({
  selector: 'app-profile-settings-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="settings-card card border-0 overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <div class="mb-4 pb-2">
          <h3 class="h5 mb-1 font-semibold text-dark">{{ 'PROFILE.ACCOUNT_SETTINGS' | translate }}</h3>
          <p class="text-muted small mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
        </div>

        <!-- 2-column Grid -->
        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div class="col" *ngFor="let action of actions; trackBy: trackByAction">
            <button
              type="button"
              class="setting-item-btn w-100 d-flex align-items-center justify-content-between p-3 rounded-4 bg-white"
              (click)="selectAction.emit(action)">
              <div class="d-flex align-items-center gap-3 text-start">
                <!-- Icon Box -->
                <div class="icon-box d-flex align-items-center justify-content-center rounded-3" [style.background-color]="action.iconBg || 'rgba(31, 28, 24, 0.04)'" [style.color]="action.iconColor || 'var(--fm-color-neutral-800)'">
                  <i class="bi" [class]="action.iconClass || 'bi-gear'"></i>
                </div>
                <!-- Label -->
                <span class="setting-label font-semibold text-dark small">{{ action.labelKey | translate }}</span>
              </div>

              <!-- Badge + Caret -->
              <div class="d-flex align-items-center gap-2">
                <span class="badge-count rounded-pill px-2 py-0.5 small" *ngIf="action.badgeValue">
                  {{ action.badgeValue }}
                </span>
                <i class="bi bi-chevron-right caret-icon text-muted"></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-card {
        background: var(--fm-glass-bg);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
      }
      .setting-item-btn {
        border: 1px solid var(--fm-border-subtle);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        cursor: pointer;
      }
      .setting-item-btn:hover {
        transform: translateY(-2px);
        box-shadow: var(--fm-shadow-md);
        border-color: rgba(184, 147, 92, 0.15);
        background-color: var(--fm-color-neutral-50) !important;
      }
      .setting-item-btn:active {
        transform: scale(0.98);
      }
      .icon-box {
        width: 40px;
        height: 40px;
        font-size: 1.2rem;
      }
      .badge-count {
        background-color: var(--fm-color-primary-soft);
        color: var(--fm-color-primary-700);
        font-size: 0.75rem;
        font-weight: 600;
      }
      .caret-icon {
        font-size: 0.85rem;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .setting-item-btn:hover .caret-icon {
        transform: translateX(3px);
      }
      :host-context([dir='rtl']) .setting-item-btn:hover .caret-icon {
        transform: scaleX(-1) translateX(3px);
      }
      :host-context([dir='rtl']) .caret-icon {
        transform: scaleX(-1);
      }
    `
  ]
})
export class ProfileSettingsCard {
  @Input() actions: readonly IActionItem[] = [];
  @Output() selectAction = new EventEmitter<IActionItem>();

  trackByAction(_: number, action: IActionItem): string {
    return action.labelKey;
  }
}
