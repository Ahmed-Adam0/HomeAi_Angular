import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Checkout } from './checkout.component';
import { ProfileService } from '../../../profile/services/profile.service';
import { IProfile } from '../../../profile/interfaces/iprofile';

describe('Checkout', () => {
  let component: Checkout;
  let fixture: ComponentFixture<Checkout>;
  let mockProfileService: jasmine.SpyObj<ProfileService>;

  const dummyProfile: IProfile = {
    userId: 'user-123',
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phoneNumber: '+1234567890',
    addresses: [
      { id: 388 as any, label: 'Office', addressLine1: '456 Tech Park', city: 'Cairo', country: 'Egypt', primary: false },
      { id: 387 as any, label: 'Home', addressLine1: '123 Nile St', city: 'Cairo', country: 'Egypt', primary: true }
    ]
  };

  beforeEach(async () => {
    mockProfileService = jasmine.createSpyObj('ProfileService', ['getProfile', 'updateProfile']);
    mockProfileService.getProfile.and.returnValue(of(dummyProfile));

    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: ProfileService, useValue: mockProfileService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load and sort addresses oldest first and preselect primary', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    // Access the child CheckoutFormComponent
    const childDebug = fixture.debugElement.query(
      el => el.name === 'app-checkout-form-page'
    );
    expect(childDebug).toBeTruthy();
    const formComp = childDebug.componentInstance;

    expect(formComp.savedAddresses().length).toBe(2);
    // Should be sorted oldest first (387 then 388)
    expect(formComp.savedAddresses()[0].id as any).toBe(387);
    expect(formComp.savedAddresses()[1].id as any).toBe(388);
    
    // Default/primary (387) should be selected
    expect(formComp.selectedAddressId() as any).toBe(387);
    expect(formComp.showAddAddressForm()).toBeFalse();
  }));
});
