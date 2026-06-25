import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { UiState } from '../../../../core/state/ui.state';
import { IProduct } from '../../../products/interfaces/iproduct';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-inspiration-analysis-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './inspiration-analysis-modal.component.html',
  styleUrl: './inspiration-analysis-modal.component.css'
})
export class InspirationAnalysisModal {
  protected readonly aiService = inject(AiService);
  private readonly uiState = inject(UiState);

  close(): void {
    this.aiService.isInspirationOpen.set(false);
  }

  createExactOrder(): void {
    // Construct a custom custom-made product from the specs
    const customProduct: IProduct = {
      id: 999, // custom custom product
      nameEn: 'Custom Lounge Chair (Inspiration Design)',
      nameAr: 'كرسي صالة مخصص (تصميم ملهم)',
      descriptionEn: 'Custom-made lounge chair manufactured specifically to match your uploaded inspiration specs: Bouclé Fabric, Solid Walnut legs, Cream/Off-white finish.',
      descriptionAr: 'كرسي صالة مصنوع خصيصاً لمطابقة مواصفات الإلهام المرفوعة الخاصة بك.',
      price: 950,
      categoryId: 3,
      categoryNameEn: 'Chairs',
      categoryNameAr: 'كراسي',
      workshopId: 10,
      workshopNameEn: 'FurniMind Custom',
      workshopNameAr: 'فورني مايند مخصص',
      createdAt: new Date().toISOString(),
      mainImageUrl: this.aiService.uploadedInspirationImage()
    };

    void this.aiService.addProductToCart(customProduct);
    this.close();
  }

  findSimilarProducts(): void {
    this.uiState.showAlert('success', 'Marketplace search filtering triggered for Mid-Century Modern lounge chairs in Cream Bouclé fabric!');
  }

  addRecommendedToCart(product: IProduct, matchPercent: number, event: Event): void {
    event.stopPropagation();
    this.aiService.addProductToCart(product);
    this.uiState.showAlert('success', `Added the ${matchPercent}% match alternative to your cart!`);
  }
}
