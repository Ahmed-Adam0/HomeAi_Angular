import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../interfaces/iproduct';
import { ProductCard } from '../../../../shared/components/product-card/product-card.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [RouterLink, NgIf, NgFor, ProductCard, SkeletonLoader, TranslatePipe],
  templateUrl: './featured-products.component.html',
  styleUrl: './featured-products.component.css'
})
export class FeaturedProductsComponent implements OnInit {
  private productService = inject(ProductService);
  protected translationService = inject(TranslationService);

  readonly featuredProducts = signal<IProduct[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly hasError = signal<boolean>(false);

  ngOnInit(): void {
    this.hasError.set(false);
    this.productService.getFeaturedProducts().subscribe({
      next: (data) => {
        this.featuredProducts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load featured products', err);
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }
}
