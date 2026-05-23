import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-contact-us-page',
  imports: [ReactiveFormsModule, AlertComponent],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);

  contactForm!: FormGroup;
  submitting = false;
  
  readonly successMessage = signal<string>('');
  readonly errorMessage = signal<string>('');

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', [Validators.required, Validators.minLength(5)]],
      message: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.successMessage.set('');
    this.errorMessage.set('');

    this.contactService.submitInquiry(this.contactForm.value).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.successMessage.set(res.message);
          this.contactForm.reset();
        } else {
          this.errorMessage.set('Submission failed. Please try again.');
        }
      },
      error: () => {
        this.submitting = false;
        this.errorMessage.set('An error occurred. Please try again.');
      }
    });
  }
}
