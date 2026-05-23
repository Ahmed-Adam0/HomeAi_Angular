import { Component, inject, OnInit, signal } from '@angular/core';
import { AddressService, IAddress } from '../../services/address.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-address-list-page',
  imports: [EmptyStateComponent, ConfirmDialog],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.css'
})
export class AddressListComponent implements OnInit {
  private addressService = inject(AddressService);

  readonly addresses = signal<IAddress[]>([]);
  readonly showDeleteDialog = signal<boolean>(false);
  readonly targetDeleteId = signal<string>('');

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.addressService.getAddresses().subscribe((data) => {
      this.addresses.set(data);
    });
  }

  openDeleteDialog(id: string): void {
    this.targetDeleteId.set(id);
    this.showDeleteDialog.set(true);
  }

  onConfirmDelete(): void {
    this.addressService.deleteAddress(this.targetDeleteId());
    this.showDeleteDialog.set(false);
    this.loadAddresses();
  }

  onCancelDelete(): void {
    this.showDeleteDialog.set(false);
  }
}
