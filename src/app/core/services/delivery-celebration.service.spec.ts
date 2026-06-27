import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal, DestroyRef } from '@angular/core';
import { Subject, of } from 'rxjs';
import { DeliveryCelebrationService } from './delivery-celebration.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { OrdersApiService } from '../../features/orders/data-access/orders-api.service';
import { NotificationHubService } from '../../features/notifications/services/notification-hub.service';
import { NotificationService } from '../../features/notifications/services/notification.service';
import { TranslationService } from '../../shared/i18n/translation.service';
import { IOrder } from '../../features/orders/interfaces';

describe('DeliveryCelebrationService', () => {
  let service: DeliveryCelebrationService;
  let mockAuthService: any;
  let mockOrdersApi: any;
  let mockHubService: any;
  let mockNotificationService: any;
  let mockTranslationService: any;
  let mockRouter: any;
  let isAuthenticatedSignal: any;

  beforeEach(() => {
    isAuthenticatedSignal = signal(false);

    mockAuthService = {
      isAuthenticated: () => isAuthenticatedSignal(),
      currentUser: () => ({ id: '123' }),
    };

    mockOrdersApi = {
      getMyOrders: () => of([]),
    };

    mockHubService = {
      newNotifications$: new Subject<any>(),
    };

    mockNotificationService = {
      addNotification: jasmine.createSpy('addNotification'),
    };

    mockTranslationService = {
      translate: (key: string) => key,
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
    };

    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        DeliveryCelebrationService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: OrdersApiService, useValue: mockOrdersApi },
        { provide: NotificationHubService, useValue: mockHubService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(DeliveryCelebrationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not show modal if order is not delivered', () => {
    const orders: IOrder[] = [
      { id: '209', status: 'pending', orderNumber: 'ORD-000209' } as any,
    ];
    service.checkOrders(orders);
    expect(service.isModalVisible()).toBeFalse();
  });

  it('should show modal and set LocalStorage flag when an un-shown delivered order is found', () => {
    const orders: IOrder[] = [
      { id: '209', status: 'delivered', orderNumber: 'ORD-000209' } as any,
    ];
    service.checkOrders(orders);
    expect(service.isModalVisible()).toBeTrue();
    expect(service.deliveredOrderId()).toBe('209');
    expect(service.deliveredOrderNumber()).toBe('ORD-000209');
    expect(localStorage.getItem('delivery_modal_shown_209')).toBe('true');
  });

  it('should skip showing modal if LocalStorage flag already exists', () => {
    localStorage.setItem('delivery_modal_shown_209', 'true');
    const orders: IOrder[] = [
      { id: '209', status: 'delivered', orderNumber: 'ORD-000209' } as any,
    ];
    service.checkOrders(orders);
    expect(service.isModalVisible()).toBeFalse();
  });

  it('should show modal for a new delivered order even if another one was already shown', () => {
    localStorage.setItem('delivery_modal_shown_209', 'true');
    const orders: IOrder[] = [
      { id: '209', status: 'delivered', orderNumber: 'ORD-000209' } as any,
      { id: '211', status: 'delivered', orderNumber: 'ORD-000211' } as any,
    ];
    service.checkOrders(orders);
    expect(service.isModalVisible()).toBeTrue();
    expect(service.deliveredOrderId()).toBe('211');
    expect(localStorage.getItem('delivery_modal_shown_211')).toBe('true');
  });
});
