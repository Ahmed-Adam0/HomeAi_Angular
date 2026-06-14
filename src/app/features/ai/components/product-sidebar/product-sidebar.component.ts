import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiService } from '../../services/ai.service';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-product-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-sidebar.component.html',
  styleUrl: './product-sidebar.component.css'
})
export class ProductSidebar {
  protected readonly aiService = inject(AiService);
  private readonly uiState = inject(UiState);

  // Customization presets for cycling
  private readonly colors = ['Natural Oak', 'Tan Leather', 'Forest Green', 'Charcoal Gray', 'Cognac', 'Cream', 'Brass'];
  private readonly materials = ['Linen Blend Fabric', 'Solid Wood & Glass', 'Brushed Brass', 'Wood Veneer & Metal', 'Bouclé Fabric', 'Top-Grain Leather', 'Velvet Fabric'];
  private readonly woodTypes = ['Solid Ash Wood', 'Walnut', 'Oak', 'Mahogany', 'Maple', 'N/A'];

  close(): void {
    this.aiService.closeSidebar();
  }

  cycleWoodType(productId: number): void {
    const current = this.aiService.selectedWoodType()[productId] || 'N/A';
    if (current === 'N/A') {
      this.uiState.showAlert('info', 'Wood type customization is not applicable for this item.');
      return;
    }
    const idx = this.woodTypes.indexOf(current);
    const nextIdx = (idx + 1) % (this.woodTypes.length - 1); // skip N/A
    const nextVal = this.woodTypes[nextIdx];
    
    this.aiService.updateProductSpec(productId, 'woodType', nextVal);
    this.uiState.showAlert('success', `Swapped wood type to ${nextVal}`);
  }

  cycleColor(productId: number): void {
    const current = this.aiService.selectedColor()[productId] || 'Ivory';
    const idx = this.colors.indexOf(current);
    const nextIdx = idx === -1 ? 0 : (idx + 1) % this.colors.length;
    const nextVal = this.colors[nextIdx];

    this.aiService.updateProductSpec(productId, 'color', nextVal);
    this.uiState.showAlert('success', `Swapped color to ${nextVal}`);
  }

  cycleMaterial(productId: number): void {
    const current = this.aiService.selectedMaterial()[productId] || 'Linen';
    const idx = this.materials.indexOf(current);
    const nextIdx = idx === -1 ? 0 : (idx + 1) % this.materials.length;
    const nextVal = this.materials[nextIdx];

    this.aiService.updateProductSpec(productId, 'material', nextVal);
    this.uiState.showAlert('success', `Swapped material to ${nextVal}`);
  }

  replaceProduct(): void {
    const hs = this.aiService.selectedHotspot();
    if (!hs) return;
    
    // Toggle coffee table between Atelier (102) and Glass table (107)
    // Toggle sofa between Nordic (101) and Classic Leather (106)
    if (hs.productId === 102) {
      this.aiService.replaceProductInHotspot(hs.id, 107);
      this.uiState.showAlert('success', 'Swapped coffee table to Glass Coffee Table');
    } else if (hs.productId === 107) {
      this.aiService.replaceProductInHotspot(hs.id, 102);
      this.uiState.showAlert('success', 'Swapped coffee table to Atelier Coffee Table');
    } else if (hs.productId === 101) {
      this.aiService.replaceProductInHotspot(hs.id, 106);
      this.uiState.showAlert('success', 'Swapped sofa to Classic Leather Sofa');
    } else if (hs.productId === 106) {
      this.aiService.replaceProductInHotspot(hs.id, 101);
      this.uiState.showAlert('success', 'Swapped sofa to Nordic Lounge Sofa');
    } else {
      this.uiState.showAlert('info', 'Alternative models are currently only configured for the Sofa and Coffee Table.');
    }
  }

  editProduct(): void {
    this.uiState.showAlert('info', 'Advanced manual visual model editor is launching in mock mode.');
  }

  addToCart(): void {
    const product = this.aiService.selectedProduct();
    if (!product) return;
    this.aiService.addProductToCart(product);
  }
}
