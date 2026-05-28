import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { Button } from '../../../../shared/components/button/button.component';
import { IOrderItem } from '../../interfaces';

@Component({
  selector: 'app-ordered-items',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe, Button],
  templateUrl: './ordered-items.component.html',
  styleUrl: './ordered-items.component.css',
})
export class OrderedItemsComponent {
  readonly items = input.required<IOrderItem[]>();
}

