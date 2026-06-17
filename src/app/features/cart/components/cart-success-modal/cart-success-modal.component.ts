import { Component, inject, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CartSuccessService } from '../../services/cart-success.service';

@Component({
  selector: 'app-cart-success-modal',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe],
  templateUrl: './cart-success-modal.component.html',
  styleUrl: './cart-success-modal.component.css',
})
export class CartSuccessModalComponent {
  readonly cartSuccessService = inject(CartSuccessService);
  readonly translationService = inject(TranslationService);

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.cartSuccessService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('csm-overlay')) {
      this.close();
    }
  }
}
