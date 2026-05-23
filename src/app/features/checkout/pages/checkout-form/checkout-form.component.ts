import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CheckoutService } from '../../services/checkout.service';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { Router } from '@angular/router';

@Component({
  selector: 'app-checkout-form-page',
  imports: [ReactiveFormsModule],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.css'
})
export class CheckoutFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private router = inject(Router);

  checkoutForm!: FormGroup;
  submitting = false;

  ngOnInit(): void {
    this.checkoutForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator()]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      country: ['US', [Validators.required]],
      shippingOption: ['standard', [Validators.required]],
      paymentProvider: ['stripe', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValues = this.checkoutForm.value;
    
    const checkoutDetails = {
      billingDetails: {
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        addressLine1: formValues.addressLine1,
        addressLine2: formValues.addressLine2,
        city: formValues.city,
        zipCode: formValues.zipCode,
        country: formValues.country
      },
      shippingOption: formValues.shippingOption,
      paymentProvider: formValues.paymentProvider
    };

    this.checkoutService.submitCheckout(checkoutDetails).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.router.navigate(['/payment']);
        }
      },
      error: () => {
        this.submitting = false;
      }
    });
  }
}
