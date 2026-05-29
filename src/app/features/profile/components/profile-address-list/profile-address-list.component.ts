import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { IAddressDto } from '../../interfaces/iaddress.dto';
import { ProfileAddressCard } from '../profile-address-card/profile-address-card.component';
import { ProfileAddressForm } from '../profile-address-form/profile-address-form.component';

@Component({
  selector: 'app-profile-address-list',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RtlDirective, ProfileAddressCard, ProfileAddressForm],
  template: `
    <div appRtl class="address-list-card card border-0 overflow-hidden mt-4">
      <div class="card-body p-4 p-md-5">
        <!-- Header -->
        <div class="d-flex align-items-center justify-content-between mb-4 pb-2">
          <div>
            <h3 class="h5 mb-1 font-semibold text-dark">{{ 'PROFILE.ADDRESS' | translate }}</h3>
            <p class="text-muted small mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
          </div>
          <!-- Add Address Button (hidden when form is open) -->
          <button
            *ngIf="!isFormOpen()"
            type="button"
            class="btn btn-sm btn-dark d-flex align-items-center gap-1.5 rounded-pill px-3"
            (click)="onAddNew()">
            <i class="bi bi-plus-lg"></i>
            {{ 'PROFILE.ADD_ADDRESS' | translate }}
          </button>
        </div>

        <!-- Inline Address Form (Expandable) -->
        <div *ngIf="isFormOpen()">
          <app-profile-address-form
            [address]="editingAddress()"
            [submitting]="submitting"
            (saveAddress)="onSaveAddress($event)"
            (cancel)="onCloseForm()">
          </app-profile-address-form>
        </div>

        <!-- Address Cards Grid -->
        <div class="row g-3" *ngIf="addresses && addresses.length > 0; else emptyState">
          <div class="col-12 col-md-6" *ngFor="let address of addresses; trackBy: trackByAddress">
            <app-profile-address-card
              [address]="address"
              (edit)="onEdit($event)"
              (delete)="onDelete($event)"
              (setPrimary)="onSetPrimary($event)">
            </app-profile-address-card>
          </div>
        </div>

        <!-- Empty State -->
        <ng-template #emptyState>
          <div class="empty-state-box p-5 rounded-4 text-center d-flex flex-column align-items-center justify-content-center border" *ngIf="!isFormOpen()">
            <div class="empty-icon-wrapper d-flex align-items-center justify-content-center rounded-circle mb-3 bg-light">
              <i class="bi bi-map text-muted fs-3"></i>
            </div>
            <p class="text-muted mb-4 small max-width-350 mx-auto">
              {{ 'PROFILE.NO_ADDRESSES' | translate }}
            </p>
            <button
              type="button"
              class="btn btn-md btn-dark rounded-pill px-4"
              (click)="onAddNew()">
              <i class="bi bi-plus-lg me-1.5"></i>
              {{ 'PROFILE.ADD_ADDRESS' | translate }}
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `
      .address-list-card {
        background: var(--fm-glass-bg);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
      }
      .empty-state-box {
        background-color: rgba(244, 242, 238, 0.2);
        border: 1px dashed var(--fm-border-medium) !important;
      }
      .empty-icon-wrapper {
        width: 60px;
        height: 60px;
      }
      .max-width-350 {
        max-width: 350px;
      }
    `
  ]
})
export class ProfileAddressList {
  @Input() addresses: IAddressDto[] = [];
  @Input() submitting = false;
  @Output() updateAddresses = new EventEmitter<IAddressDto[]>();

  readonly isFormOpen = signal(false);
  readonly editingAddress = signal<IAddressDto | null>(null);

  onAddNew(): void {
    this.editingAddress.set(null);
    this.isFormOpen.set(true);
  }

  onEdit(address: IAddressDto): void {
    this.editingAddress.set(address);
    this.isFormOpen.set(true);
  }

  onCloseForm(): void {
    this.isFormOpen.set(false);
    this.editingAddress.set(null);
  }

  onSaveAddress(address: IAddressDto): void {
    let updatedList: IAddressDto[] = [];

    // If it's a primary address, set all other addresses' primary flag to false
    if (address.primary) {
      this.addresses = this.addresses.map(a => ({ ...a, primary: false }));
    }

    if (address.id || (this.editingAddress() && (this.editingAddress()?.id || this.editingAddress()?.addressLine1))) {
      // Editing existing address
      const lookupVal = address.id || this.editingAddress()?.id || this.editingAddress()?.addressLine1;
      updatedList = this.addresses.map(a => {
        const match = a.id === lookupVal || a.addressLine1 === lookupVal;
        return match ? { ...a, ...address } : a;
      });
    } else {
      // Adding new address
      const newAddress: IAddressDto = {
        ...address,
        id: address.id || 'addr_' + Date.now().toString(), // Generate temporary ID
        primary: address.primary || this.addresses.length === 0, // Set default if it's the first one
      };
      updatedList = [...this.addresses, newAddress];
    }

    // Ensure at least one address is marked primary if list is not empty
    if (updatedList.length > 0 && !updatedList.some(a => a.primary)) {
      updatedList[0].primary = true;
    }

    this.updateAddresses.emit(updatedList);
    this.onCloseForm();
  }

  onDelete(lookupKey: string): void {
    let updatedList = this.addresses.filter(a => a.id !== lookupKey && a.addressLine1 !== lookupKey);

    // If we deleted the primary address, make another one primary
    if (updatedList.length > 0 && !updatedList.some(a => a.primary)) {
      updatedList[0].primary = true;
    }

    this.updateAddresses.emit(updatedList);
  }

  onSetPrimary(address: IAddressDto): void {
    const updatedList = this.addresses.map(a => {
      const match = a.id === address.id || a.addressLine1 === address.addressLine1;
      return { ...a, primary: match };
    });
    this.updateAddresses.emit(updatedList);
  }

  trackByAddress(_: number, item: IAddressDto): string {
    return item.id || item.addressLine1;
  }
}
