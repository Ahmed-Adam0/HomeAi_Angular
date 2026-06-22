import { Component, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IShippingAddress } from '../../interfaces';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-shipping-info',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './shipping-info.component.html',
  styleUrl: './shipping-info.component.css',
})
export class ShippingInfoComponent {
  readonly address = input.required<IShippingAddress>();
  readonly trackingNumber = input<string | null>(null);
  readonly carrier = input<string | null>(null);
  readonly estimatedDeliveryDate = input<string | null>(null);
  readonly firstName = input<string | null>(null);
  readonly lastName = input<string | null>(null);
  readonly email = input<string | null>(null);

  private uiState = inject(UiState);

  copyTracking(): void {
    const tracking = this.trackingNumber();
    if (tracking) {
      navigator.clipboard.writeText(tracking).then(() => {
        this.uiState.showAlert('success', 'Tracking number copied.');
      });
    }
  }
}


