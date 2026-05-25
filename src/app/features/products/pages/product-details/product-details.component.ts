import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { IProduct } from '../../interfaces/iproduct';
import { IReview } from '../../interfaces/ireview';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, SkeletonLoader, CurrencyFormatPipe, DatePipe],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetails implements OnInit, OnDestroy {
  private productService = inject(ProductService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly translationService = inject(TranslationService);

  protected readonly Math = Math;

  // States
  readonly product = signal<IProduct | undefined>(undefined);
  readonly isLoading = signal<boolean>(true);
  readonly activeImage = signal<string>('');
  readonly itemQuantity = signal<number>(1);

  // Reusable reviews database virtualized locally
  readonly reviews = signal<IReview[]>([]);

  private routeSub!: Subscription;

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProductDetails(id);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadProductDetails(id: string): void {
    this.isLoading.set(true);
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        if (data) {
          this.product.set(data);
          this.activeImage.set(data.mainImageUrl);
          this.generateMockReviews(data.id);
        } else {
          this.router.navigate(['/404']);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.isLoading.set(false);
        this.router.navigate(['/404']);
      }
    });
  }

  generateMockReviews(productId: string | number): void {
    // Generate beautiful contextual mock reviews based on product coordinates and ratings
    this.reviews.set([
      {
        id: 'rev-1',
        productId: productId.toString(),
        userId: 'user-sarah',
        userName: 'Sarah Jenkins',
        rating: 5,
        title: 'Perfect Spatial Harmony!',
        comment: 'I used the Spatial AI chat to place this in my lounge. The coordinate guidelines were 100% correct, and the piece physically fits beautifully. Fabric texture is top-tier.',
        verifiedPurchase: true,
        createdAt: '2026-04-12T10:00:00Z'
      },
      {
        id: 'rev-2',
        productId: productId.toString(),
        userId: 'user-david',
        userName: 'David Miller',
        rating: 4,
        title: 'Stunning design, heavy item',
        comment: 'Absolutely gorgeous lines. It is solid stone and quite heavy, so keep that in mind. Assembly was minimal but needed two people. Highly recommended.',
        verifiedPurchase: true,
        createdAt: '2026-05-01T14:30:00Z'
      }
    ]);
  }

  setActiveImage(img: string): void {
    this.activeImage.set(img);
  }

  incrementQuantity(): void {
    this.itemQuantity.update((q) => q + 1);
  }

  decrementQuantity(): void {
    this.itemQuantity.update((q) => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    if (!this.product()) return;
    
    const prodName = this.translationService.currentLang() === 'ar' ? this.product()?.nameAr : this.product()?.nameEn;
    // Showcase interaction alert
    alert(`Successfully added ${this.itemQuantity()} x ${prodName} to cart!`);
  }
}
