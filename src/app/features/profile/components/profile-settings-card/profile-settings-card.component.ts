import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface IActionItem {
  labelKey: string;
  route: string;
}

@Component({
  selector: 'app-profile-settings-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="settings-card card border-0 shadow-sm rounded-4 bg-white">
      <div class="card-body p-4">
        <div class="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h3 class="h5 mb-1">{{ 'PROFILE.ACCOUNT_SETTINGS' | translate }}</h3>
            <p class="text-muted mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
          </div>
        </div>

        <div class="settings-list d-grid gap-3">
          <button
            *ngFor="let action of actions; trackBy: trackByAction"
            type="button"
            class="w-100 btn btn-outline-secondary rounded-4 text-start px-3 py-3"
            (click)="selectAction.emit(action)">
            {{ action.labelKey | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .settings-card {
        min-height: 100%;
      }
      .settings-list button {
        transition: background-color 0.2s ease, border-color 0.2s ease;
      }
      .settings-list button:hover {
        background-color: #f8f9fa;
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
