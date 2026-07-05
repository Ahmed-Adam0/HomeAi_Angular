import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { PlatformService } from '../../services/platform.service';
import { Navbar } from '../../../shared/components/navbar/navbar.component';
import { Footer } from '../../../shared/components/footer/footer.component';
import { RtlDirective } from '../../../shared/directives/rtl.directive';
import { UiState } from '../../state/ui.state';
import { AlertComponent } from '../../../shared/components/alert/alert.component';
import { AuthRequiredDialogComponent } from '../../components/auth-required-dialog/auth-required-dialog.component';
import { ConfirmDialogContainer } from '../../../shared/components/confirm-dialog/confirm-dialog-container.component';
import { ToastContainer } from '../../../shared/components/toast/toast.component';
import { ChatbotWidget } from '../../../shared/components/chatbot-widget/chatbot-widget.component';
import { ScrollToTop } from '../../../shared/components/scroll-to-top/scroll-to-top.component';
import { CartSuccessModalComponent } from '../../../features/cart/components/cart-success-modal/cart-success-modal.component';
import { PaymentOverlayComponent } from '../../../features/payment/components/payment-overlay/payment-overlay.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Footer, RtlDirective, AlertComponent, AuthRequiredDialogComponent, ConfirmDialogContainer, ToastContainer, ChatbotWidget, ScrollToTop, CartSuccessModalComponent, PaymentOverlayComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements OnInit {
  readonly uiState = inject(UiState);
  readonly platform = inject(PlatformService);
  private readonly router = inject(Router);
  readonly isAiChatRoute = signal(false);

  constructor() {
    console.log(`[Diagnostic] MainLayoutComponent constructor. platform.isNative() = ${this.platform.isNative()}`);
    this.updateAiChatRoute(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        this.updateAiChatRoute(event.urlAfterRedirects);
      });
  }

  ngOnInit() {
    console.log(`[Diagnostic] MainLayoutComponent ngOnInit. platform.isNative() = ${this.platform.isNative()}`);
  }

  private updateAiChatRoute(url: string): void {
    const cleanUrl = url.split('?')[0].split('#')[0];
    this.isAiChatRoute.set(
      cleanUrl === '/ai-chat' || cleanUrl.endsWith('/ai-chat') || cleanUrl.includes('/ai-chat/')
    );
  }
}

