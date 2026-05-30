import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IWorkshopProfileFormValue } from '../../interfaces/iworkshop-profile-form';

@Component({
  selector: 'app-workshop-profile-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './workshop-profile-form.component.html',
  styleUrl: './workshop-profile-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkshopProfileForm {
  private readonly fb = inject(FormBuilder);

  /** Set on submit so validation surfaces for untouched controls. */
  protected readonly submitted = signal(false);

  readonly form = this.fb.group({
    workshopName: this.fb.nonNullable.control<IWorkshopProfileFormValue['workshopName']>('', {
      validators: [Validators.required],
    }),
    description: this.fb.nonNullable.control<IWorkshopProfileFormValue['description']>('', {
      validators: [Validators.required],
    }),
    email: this.fb.nonNullable.control<IWorkshopProfileFormValue['email']>('', {
      validators: [Validators.required, Validators.email],
    }),
    phone: this.fb.nonNullable.control<IWorkshopProfileFormValue['phone']>('', {
      validators: [Validators.required],
    }),
    address: this.fb.nonNullable.control<IWorkshopProfileFormValue['address']>('', {
      validators: [Validators.required],
    }),
    logo: this.fb.nonNullable.control<IWorkshopProfileFormValue['logo']>(''),
  });

  protected onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Reserved for future VendorService integration.
  }

  protected onCancel(): void {
    this.submitted.set(false);
    this.form.reset();
  }
}
