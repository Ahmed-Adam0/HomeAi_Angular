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
          <h3 class="h5 mb-1 font-bold tracking-tight">{{ 'PROFILE.ACCOUNT_SETTINGS' | translate }}</h3>
          <p class="text-muted small mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
        </div>

        <!-- 2-column Grid -->
        <div class="row row-cols-1 row-cols-md-2 g-3">
          <div class="col" *ngFor="let action of actions; trackBy: trackByAction">
            <button
              type="button"
              class="setting-item-btn w-100 d-flex align-items-center justify-content-between p-3.5 rounded-4"
              (click)="selectAction.emit(action)">
              <div class="d-flex align-items-center gap-3 text-start">
                <!-- Icon Box -->
                <div class="icon-box d-flex align-items-center justify-content-center rounded-3" [style.background-color]="action.iconBg || 'var(--fm-color-primary-soft)'" [style.color]="action.iconColor || 'var(--fm-color-primary-500)'">
                  <i class="bi" [class]="action.iconClass || 'bi-gear'"></i>
                </div>
                <!-- Label & Desc -->
                <div class="d-flex flex-column">
                  <span class="setting-label font-bold small">{{ action.labelKey | translate }}</span>
                  <span class="setting-desc text-muted">{{ action.labelKey + '_DESC' | translate }}</span>
                </div>
              </div>

              <!-- Badge + Caret -->
              <div class="d-flex align-items-center gap-2 flex-shrink-0">
                <span class="badge-count rounded-pill px-2 py-0.5" *ngIf="action.badgeValue">
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
      h3 {
        color: var(--fm-text-heading);
      }
      .settings-card {
        background: var(--fm-glass-bg);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
        transition: var(--fm-transition-smooth);
      }
      .settings-card:hover {
        box-shadow: var(--fm-shadow-xl) !important;
        border-color: var(--fm-color-primary-soft) !important;
      }
      .setting-item-btn {
        border: 1px solid var(--fm-border-medium);
        background-color: var(--fm-color-neutral-100) !important;
        transition: var(--fm-transition-smooth);
        cursor: pointer;
        outline: none;
      }
      .setting-item-btn:hover {
        transform: translateY(-3px);
        box-shadow: var(--fm-shadow-md);
        border-color: var(--fm-color-primary-soft);
        background-color: var(--fm-surface-card) !important;
      }
      .setting-item-btn:active {
        transform: scale(0.98);
      }
      .icon-box {
        width: 44px;
        height: 44px;
        font-size: 1.2rem;
        flex-shrink: 0;
        transition: var(--fm-transition-smooth);
      }
      .setting-item-btn:hover .icon-box {
        transform: scale(1.05);
      }
      .setting-label {
        font-size: 0.88rem;
        color: var(--fm-text-body);
      }
      .setting-desc {
        font-size: 0.72rem;
        font-weight: 500;
        color: var(--fm-text-muted);
        margin-top: 2px;
      }
      .badge-count {
        background-color: var(--fm-color-primary-soft);
        color: var(--fm-color-primary-700);
        font-size: 0.72rem;
        font-weight: 700;
      }
      .caret-icon {
        font-size: 0.85rem;
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .setting-item-btn:hover .caret-icon {
        transform: translateX(4px);
        color: var(--fm-color-primary-500) !important;
      }
      :host-context([dir='rtl']) .setting-item-btn:hover .caret-icon {
        transform: scaleX(-1) translateX(4px);
      }
      :host-context([dir='rtl']) .caret-icon {
        transform: scaleX(-1);
      }
      :host-context([dir='rtl']) .text-start {
        text-align: right !important;
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
