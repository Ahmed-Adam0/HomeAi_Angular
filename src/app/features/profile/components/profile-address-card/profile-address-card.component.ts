import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IAddressDto } from '../../interfaces/iaddress.dto';

@Component({
  selector: 'app-profile-address-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="address-card p-4 rounded-4 bg-white d-flex flex-column justify-content-between h-100 position-relative transition-all">
      <div>
        <!-- Card Header -->
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <div class="label-icon-box d-flex align-items-center justify-content-center rounded-3">
              <i class="bi bi-geo-alt-fill text-brand"></i>
            </div>
            <span class="font-semibold text-dark">{{ address.label || ('PROFILE.ADDRESS' | translate) }}</span>
          </div>
          <!-- Primary Default Badge -->
          <span class="badge default-badge px-2 py-1 rounded-pill small" *ngIf="address.primary">
            {{ 'PROFILE.DEFAULT_BADGE' | translate }}
          </span>
        </div>

        <!-- Address Body -->
        <div class="address-details text-muted small mb-4">
          <div class="font-medium text-dark mb-1">{{ address.addressLine1 }}</div>
          <div *ngIf="address.addressLine2">{{ address.addressLine2 }}</div>
          <div>
            {{ address.city }}<span *ngIf="address.postalCode">, {{ address.postalCode }}</span>
          </div>
          <div class="text-uppercase" style="font-size: 0.75rem; letter-spacing: 0.02em;">{{ address.country }}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions d-flex align-items-center gap-3 pt-3 border-top mt-auto">
        <button
          type="button"
          class="btn btn-xs btn-ghost text-dark d-flex align-items-center gap-1.5"
          (click)="edit.emit(address)">
          <i class="bi bi-pencil-square"></i>
          {{ 'PROFILE.EDIT' | translate }}
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost text-danger d-flex align-items-center gap-1.5 ms-auto"
          (click)="onDelete()">
          <i class="bi bi-trash3"></i>
          {{ 'PROFILE.DELETE_ADDRESS' | translate }}
        </button>
      </div>

      <!-- Option to set as default if not default yet -->
      <button
        *ngIf="!address.primary"
        type="button"
        class="set-default-trigger position-absolute border-0 bg-transparent text-muted small hover-brand pointer"
        (click)="setPrimary.emit(address)">
        {{ 'PROFILE.SET_DEFAULT' | translate }}
      </button>
    </div>
  `,
  styles: [
    `
      .address-card {
        border: 1px solid var(--fm-border-medium);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        min-height: 190px;
      }
      .address-card:hover {
        transform: translateY(-3px);
        box-shadow: var(--fm-shadow-md);
        border-color: rgba(184, 147, 92, 0.2);
      }
      .label-icon-box {
        width: 32px;
        height: 32px;
        background-color: var(--fm-color-primary-soft);
      }
      .default-badge {
        background-color: var(--fm-color-primary-500);
        color: #ffffff;
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.02em;
      }
      .set-default-trigger {
        top: 1rem;
        right: 1rem;
        font-size: 0.7rem;
        font-weight: 500;
        opacity: 0;
        transition: opacity 0.2s ease, color 0.2s ease;
      }
      .address-card:hover .set-default-trigger {
        opacity: 1;
      }
      .hover-brand:hover {
        color: var(--fm-color-primary-500) !important;
      }
      .btn-ghost {
        font-size: 0.8rem;
        padding: 4px 8px;
        border-radius: var(--fm-radius-sm);
        height: auto;
      }
      .pointer {
        cursor: pointer;
      }
      :host-context([dir='rtl']) .set-default-trigger {
        right: auto;
        left: 1rem;
      }
    `
  ]
})
export class ProfileAddressCard {
  @Input() address!: IAddressDto;
  @Output() edit = new EventEmitter<IAddressDto>();
  @Output() delete = new EventEmitter<string>();
  @Output() setPrimary = new EventEmitter<IAddressDto>();

  onDelete(): void {
    // Emit id if exists, fallback to addressLine1 (for newly created, unsaved address entries)
    this.delete.emit(this.address.id || this.address.addressLine1);
  }
}
