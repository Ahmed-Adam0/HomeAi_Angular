import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IAddressDto } from '../../interfaces/iaddress.dto';

@Component({
  selector: 'app-profile-address-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="address-card p-4 rounded-4 d-flex flex-column justify-content-between h-100 position-relative transition-all">
      <div>
        <!-- Card Header -->
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <div class="d-flex align-items-center gap-2">
            <div class="label-icon-box d-flex align-items-center justify-content-center rounded-3">
              <i class="bi bi-geo-alt-fill"></i>
            </div>
            <span class="address-card-label font-bold small tracking-tight">{{ address.label || ('PROFILE.ADDRESS' | translate) }}</span>
          </div>
          <!-- Primary Default Badge -->
          <span class="badge default-badge px-2.5 py-1 rounded-pill" *ngIf="address.primary">
            {{ 'PROFILE.DEFAULT_BADGE' | translate }}
          </span>
        </div>

        <!-- Address Body -->
        <div class="address-details text-muted small mb-4">
          <div class="address-card-street font-semibold mb-1">{{ address.addressLine1 }}</div>
          <div *ngIf="address.addressLine2" class="mb-0.5">{{ address.addressLine2 }}</div>
          <div class="mb-0.5">
            {{ address.city }}<span *ngIf="address.postalCode">, {{ address.postalCode }}</span>
          </div>
          <div class="text-uppercase text-brand font-bold" style="font-size: 0.68rem; letter-spacing: 0.04em;">{{ address.country }}</div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="card-actions d-flex align-items-center gap-2 pt-3 border-top mt-auto flex-wrap">
        <button
          type="button"
          class="btn btn-xs btn-ghost-edit d-flex align-items-center gap-1.5"
          (click)="edit.emit(address)">
          <i class="bi bi-pencil-square"></i>
          {{ 'PROFILE.EDIT' | translate }}
        </button>
        <button
          type="button"
          class="btn btn-xs btn-ghost-delete d-flex align-items-center gap-1.5 ms-auto"
          (click)="onDelete()">
          <i class="bi bi-trash3-fill"></i>
          {{ 'PROFILE.DELETE_ADDRESS' | translate }}
        </button>
      </div>

      <!-- Option to set as default if not default yet -->
      <button
        *ngIf="!address.primary"
        type="button"
        class="set-default-trigger position-absolute border-0 bg-transparent text-muted small hover-brand pointer"
        (click)="setPrimary.emit(address)">
        <i class="bi bi-star-fill me-1"></i>{{ 'PROFILE.SET_DEFAULT' | translate }}
      </button>
    </div>
  `,
  styles: [
    `
      .address-card {
        border: 1px solid var(--fm-border-medium) !important;
        background-color: var(--fm-color-neutral-100) !important;
        transition: var(--fm-transition-smooth) !important;
        min-height: 190px;
        box-shadow: var(--fm-shadow-xs);
      }
      .address-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--fm-shadow-md) !important;
        border-color: var(--fm-color-primary-soft) !important;
        background-color: var(--fm-surface-card) !important;
      }
      .address-card-label {
        color: var(--fm-text-heading);
      }
      .address-card-street {
        color: var(--fm-text-heading);
      }
      .address-details {
        color: var(--fm-text-muted) !important;
      }
      .label-icon-box {
        width: 32px;
        height: 32px;
        background-color: var(--fm-color-primary-soft);
        color: var(--fm-color-primary-500);
        font-size: 0.95rem;
        transition: var(--fm-transition-smooth);
      }
      .address-card:hover .label-icon-box {
        background-color: var(--fm-color-primary-500);
        color: var(--fm-text-inverted);
      }
      .default-badge {
        background: var(--fm-color-primary-500);
        color: var(--fm-text-inverted);
        font-size: 0.62rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        border: 1px solid rgba(184, 147, 92, 0.1);
        box-shadow: 0 2px 6px var(--fm-color-primary-glow);
      }
      .set-default-trigger {
        top: 1rem;
        inset-inline-end: 1rem;
        font-size: 0.68rem;
        font-weight: 600;
        opacity: 0;
        transition: all 0.2s ease;
      }
      .address-card:hover .set-default-trigger {
        opacity: 1;
      }
      .hover-brand:hover {
        color: var(--fm-color-primary-500) !important;
      }
      .btn-ghost-edit {
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: var(--fm-radius-sm);
        height: auto;
        border: 1px solid var(--fm-border-medium);
        background-color: transparent;
        color: var(--fm-text-body);
        font-weight: 600;
        transition: var(--fm-transition-smooth);
      }
      .btn-ghost-edit:hover {
        background-color: var(--fm-color-neutral-800);
        border-color: var(--fm-color-neutral-800);
        color: var(--fm-text-inverted);
      }
      .btn-ghost-delete {
        font-size: 0.75rem;
        padding: 4px 8px;
        border-radius: var(--fm-radius-sm);
        height: auto;
        border: 1px solid var(--fm-border-medium);
        background-color: transparent;
        color: var(--fm-color-danger-500);
        font-weight: 600;
        transition: var(--fm-transition-smooth);
      }
      .btn-ghost-delete:hover {
        background-color: var(--fm-color-danger-500);
        border-color: var(--fm-color-danger-500);
        color: var(--fm-text-inverted);
        box-shadow: 0 4px 10px var(--fm-color-danger-glow);
      }
      .pointer {
        cursor: pointer;
      }
      .ms-auto {
        margin-inline-start: auto !important;
        margin-inline-end: 0 !important;
      }
      .text-brand {
        color: var(--fm-color-primary-500) !important;
      }
      .border-top {
        border-top: 1px solid var(--fm-border-medium) !important;
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
