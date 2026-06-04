import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { Button } from '../../../../shared/components/button/button.component';
import { IOrderItem } from '../../interfaces';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

@Component({
  selector: 'app-ordered-items',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe, LocalizedPipe, Button, LazyImageDirective],
  templateUrl: './ordered-items.component.html',
  styleUrl: './ordered-items.component.css',
})
export class OrderedItemsComponent {
  readonly items = input.required<IOrderItem[]>();

  readonly hasItems = computed(
    () => (this.items()?.length ?? 0) > 0
  );
}

