import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-design-summary-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './design-summary-modal.component.html',
  styleUrl: './design-summary-modal.component.css'
})
export class DesignSummaryModal {
  protected readonly aiService = inject(AiService);
  private readonly uiState = inject(UiState);

  close(): void {
    this.aiService.isSummaryOpen.set(false);
  }

  createOrder(): void {
    this.aiService.addAllToCart();
    this.uiState.showAlert('success', 'All room items have been added to your shopping cart. Redirecting to checkout...', {
      label: 'View Cart',
      routerLink: '/cart'
    });
  }
}
