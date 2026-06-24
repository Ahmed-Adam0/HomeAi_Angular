import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Profile } from './profile.component';
import { ProfileService } from '../../services/profile.service';
import { OrdersApiService } from '../../../orders/data-access/orders-api.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';
import { ProductCacheService } from '../../../../core/services/product-cache.service';
import { IProfile } from '../../interfaces/iprofile';
import { IOrder } from '../../../orders/interfaces';
import { IProduct } from '../../../products/interfaces/iproduct';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockProfileService: jasmine.SpyObj<ProfileService>;
  let mockOrdersApiService: jasmine.SpyObj<OrdersApiService>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockUiState: jasmine.SpyObj<UiState>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockProductCacheService: jasmine.SpyObj<ProductCacheService>;

  const dummyProfile: IProfile = {
    userId: 'user-1',
    fullName: 'Test User',
    email: 'test@example.com',
    profileImage: 'test-avatar.jpg',
    preferredLanguage: 'en',
    addresses: [],
    isGoogleUser: false,
    canEditEmail: true,
    membership: 'Premium Member',
    stats: {
      roomsDesigned: 5,
      productsViewed: 10,
      recommendations: 3,
      stylesExplored: 2
    }
  };

  const dummyOrders: IOrder[] = [
    {
      id: '9001',
      orderNumber: 'ORD-009001',
      userId: 'user-1',
      status: 'pending',
      items: [
        {
          productId: 101,
          productName: 'Office Chair',
          quantity: 2,
          unitPrice: 150,
          total: 300,
          productImage: ''
        }
      ],
      shippingAddress: {} as any,
      billingAddress: {} as any,
      shippingCost: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: 300,
      paymentMethod: 'Paymob',
      paymentStatus: 'pending',
      createdAt: '2026-06-16T12:00:00Z',
      updatedAt: null,
      address: '123 Main St',
      notes: '',
      statusHistory: null,
      customerName: 'Test User',
      customerPhone: '12345678'
    }
  ];

  const dummyProducts: IProduct[] = [
    {
      id: 101,
      nameAr: 'كرسي',
      nameEn: 'Chair',
      descriptionAr: '',
      descriptionEn: '',
      price: 150,
      categoryId: 1,
      categoryNameAr: 'أثاث',
      categoryNameEn: 'Furniture',
      workshopId: 1,
      workshopNameAr: 'الورشة',
      workshopNameEn: 'Workshop',
      createdAt: '2026-06-16T12:00:00Z',
      mainImageUrl: 'http://example.com/chair.jpg',
      images: []
    }
  ];

  beforeEach(async () => {
    mockProfileService = jasmine.createSpyObj('ProfileService', ['getProfile']);
    mockOrdersApiService = jasmine.createSpyObj('OrdersApiService', ['getMyOrders']);
    mockTranslationService = jasmine.createSpyObj('TranslationService', ['currentLang', 'translate']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['unreadCount']);
    mockUiState = jasmine.createSpyObj('UiState', ['showAlert']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['updateUserProfile', 'logout']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockProductCacheService = jasmine.createSpyObj('ProductCacheService', ['getProducts']);

    mockProfileService.getProfile.and.returnValue(of(dummyProfile));
    mockOrdersApiService.getMyOrders.and.returnValue(of(dummyOrders));
    mockTranslationService.currentLang.and.returnValue('en');
    mockNotificationService.unreadCount.and.returnValue(0);
    mockProductCacheService.getProducts.and.returnValue(of(dummyProducts));

    await TestBed.configureTestingModule({
      imports: [Profile],
      providers: [
        { provide: ProfileService, useValue: mockProfileService },
        { provide: OrdersApiService, useValue: mockOrdersApiService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: UiState, useValue: mockUiState },
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ProductCacheService, useValue: mockProductCacheService }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
  });

  it('should resolve product image for recent orders', fakeAsync(() => {
    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;

    // When the profile loads
    fixture.detectChanges(); // triggers ngOnInit/constructor logic
    flush(); // complete async tasks

    // Then it should have loaded the profile
    expect(component.profile()).toBeTruthy();
    expect(component.profile()?.fullName).toBe('Test User');

    // And it should have fetched the orders
    expect(mockOrdersApiService.getMyOrders).toHaveBeenCalled();

    // And it should have fetched products details
    expect(mockProductCacheService.getProducts).toHaveBeenCalledWith([101]);

    // And mapped the main image URL to the order items
    const orders = component.recentOrders();
    expect(orders.length).toBe(1);
    expect(orders[0].items[0].productImage).toBe('http://example.com/chair.jpg');
    expect(orders[0].items[0].image).toBe('http://example.com/chair.jpg');
  }));

  it('should filter Privacy & Security action for Google users', fakeAsync(() => {
    const googleProfile = { ...dummyProfile, isGoogleUser: true };
    mockProfileService.getProfile.and.returnValue(of(googleProfile));

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;

    fixture.detectChanges();
    flush();

    expect(component.profile()?.isGoogleUser).toBe(true);

    const actions = component.actionItems();
    const hasPrivacySecurity = actions.some(item => item.labelKey === 'PROFILE.PRIVACY_SECURITY');
    expect(hasPrivacySecurity).toBe(false);
  }));
});
