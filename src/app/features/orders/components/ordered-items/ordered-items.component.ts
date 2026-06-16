import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { Button } from '../../../../shared/components/button/button.component';
import { IOrderItem } from '../../interfaces';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-ordered-items',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe, LocalizedPipe, Button, LazyImageDirective, NgFor, NgIf],
  templateUrl: './ordered-items.component.html',
  styleUrl: './ordered-items.component.css',
})
export class OrderedItemsComponent {
  readonly items = input.required<IOrderItem[]>();
  readonly translationService = inject(TranslationService);

  readonly hasItems = computed(
    () => (this.items()?.length ?? 0) > 0
  );
}

