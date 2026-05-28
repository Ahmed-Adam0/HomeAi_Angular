import { Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IShippingAddress } from '../../interfaces';

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
}

