import { Component, inject, computed, signal, ChangeDetectionStrategy, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { PaymentService } from '../../services/payment.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-payment-overlay',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './payment-overlay.component.html',
  styleUrl: './payment-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentOverlayComponent {
  private paymentService = inject(PaymentService);
  private sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isVisible = this.paymentService.isOverlayVisible;
  readonly isIframeLoading = this.paymentService.isIframeLoading;
  readonly showCancelConfirmation = signal<boolean>(false);

  readonly sanitizedUrl = computed(() => {
    const url = this.paymentService.paymentUrl();
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  constructor() {
    // Body scroll lock effect
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) return;
      const visible = this.isVisible();
      if (visible) {
        document.body.classList.add('modal-open');
      } else {
        document.body.classList.remove('modal-open');
      }
      onCleanup(() => {
        document.body.classList.remove('modal-open');
      });
    });
  }

  onIframeLoad(event: Event): void {
    const iframe = event.target as HTMLIFrameElement;
    if (!iframe) return;

    if (this.isIframeLoading()) {
      this.paymentService.isIframeLoading.set(false);
    }

    try {
      const iframeWindow = iframe.contentWindow;
      if (iframeWindow) {
        const href = iframeWindow.location.href;
        console.log('[PaymentOverlay] Iframe location read successfully:', href);

        if (href.includes('/payment/success') || href.includes('success=true')) {
          this.paymentService.completePayment(true);
        } else if (href.includes('/payment/failed') || href.includes('success=false')) {
          this.paymentService.completePayment(false);
        }
      }
    } catch (e) {
      // Expected while on the Paymob hosted domain due to same-origin security policy.
    }
  }

  requestCancel(): void {
    this.showCancelConfirmation.set(true);
  }

  dismissCancel(): void {
    this.showCancelConfirmation.set(false);
  }

  confirmCancel(): void {
    this.showCancelConfirmation.set(false);
    this.paymentService.cancelPayment();
  }
}
