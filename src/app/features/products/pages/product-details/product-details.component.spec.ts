import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductDetails } from './product-details.component';
import { ProductService } from '../../services/product.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { CartService } from '../../../cart/services/cart.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('ProductDetails', () => {
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;
  let cartServiceSpy: jasmine.SpyObj<CartService>;
  let uiStateSpy: jasmine.SpyObj<UiState>;

  const mockProduct = {
    id: 1,
    nameEn: 'Luxury Lounge Chair',
    nameAr: 'كرسي صالة فاخر',
    basePrice: 5000,
    mainImageUrl: 'http://example.com/image.jpg',
    attributes: [
      {
        id: 1,
        nameEn: 'Color',
        nameAr: 'اللون',
        values: [
          { id: 10, valueEn: 'Beige', valueAr: 'بيج', priceDelta: 0 },
          { id: 11, valueEn: 'Grey', valueAr: 'رمادي', priceDelta: 200 }
        ]
      }
    ]
  };

  const mockProductService = {
    getProductById: () => of(mockProduct),
    getProducts: () => of([])
  };

  const mockFavoritesService = {
    isFavorited: () => false,
    addFavorite: () => of(null),
    removeFavorite: () => of(null)
  };

  const mockTranslationService = {
    currentLang: signal('en'),
    translate: (key: string) => key
  };

  beforeEach(async () => {
    const cartSpy = jasmine.createSpyObj('CartService', ['isProductAdding', 'addToCart']);
    cartSpy.isProductAdding.and.returnValue(false);
    cartSpy.addToCart.and.returnValue(Promise.resolve());

    const uiSpy = jasmine.createSpyObj('UiState', ['showAlert']);
    uiSpy.globalLoading = signal(false);
    uiSpy.sidebarVisible = signal(false);
    uiSpy.activeAlert = signal(null);

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ProductService, useValue: mockProductService },
        { provide: FavoritesService, useValue: mockFavoritesService },
        { provide: ActivatedRoute, useValue: { params: of({ id: '1' }) } },
        { provide: CartService, useValue: cartSpy },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: UiState, useValue: uiSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    cartServiceSpy = TestBed.inject(CartService) as jasmine.SpyObj<CartService>;
    uiStateSpy = TestBed.inject(UiState) as jasmine.SpyObj<UiState>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not automatically select option values on load', () => {
    expect(component.selectedOptions()).toEqual({});
    expect(component.finalPrice()).toBe(5000); // base price only
  });

  it('should allow adding to cart without selecting any options', () => {
    component.addToCart();
    expect(cartServiceSpy.addToCart).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 1 }),
      1,
      []
    );
  });

  it('should send selected option IDs when options are chosen', () => {
    component.selectOption('attr-1', 11);
    expect(component.finalPrice()).toBe(5200); // 5000 + 200

    component.addToCart();
    expect(cartServiceSpy.addToCart).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 1 }),
      1,
      [11]
    );
  });
});
