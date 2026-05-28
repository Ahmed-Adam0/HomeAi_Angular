import { Component, input } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IOrderItem } from '../../interfaces';

@Component({
  selector: 'app-ordered-items',
  standalone: true,
  imports: [CurrencyFormatPipe, TranslatePipe],
  templateUrl: './ordered-items.component.html',
  styleUrl: './ordered-items.component.css',
})
export class OrderedItemsComponent {
  readonly items = input.required<IOrderItem[]>();
}

