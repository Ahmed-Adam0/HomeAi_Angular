import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  standalone: true,
  selector: 'app-coupon-box',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective],
  templateUrl: './coupon-box.component.html',
  styleUrls: ['./coupon-box.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CouponBoxComponent {
  private readonly fb = inject(FormBuilder);
  private readonly translationService = inject(TranslationService);

  readonly currentLang = this.translationService.currentLang;

  readonly couponForm = this.fb.nonNullable.group({
    couponCode: ['', [Validators.required, Validators.maxLength(20)]],
  });

  @Input() disabled = false;
  @Input() status: 'idle' | 'loading' | 'success' | 'error' = 'idle';
  @Input() activeCoupon: string | null = null;
  @Input() message = '';
  @Input() savedAmountLabel = '';

  @Output() applyCoupon = new EventEmitter<string>();
  @Output() removeCoupon = new EventEmitter<void>();

  get couponControl(): FormControl<string> {
    return this.couponForm.controls.couponCode as FormControl<string>;
  }

  get isApplyDisabled(): boolean {
    return this.disabled || this.status === 'loading' || this.couponForm.invalid || !!this.activeCoupon;
  }

  requestApply(): void {
    if (this.isApplyDisabled) {
      return;
    }

    const code = this.couponControl.value.trim();
    if (!code) {
      this.couponControl.markAsTouched();
      return;
    }

    this.applyCoupon.emit(code);
  }

  requestRemove(): void {
    if (this.disabled) {
      return;
    }

    this.removeCoupon.emit();
    this.couponForm.reset({ couponCode: '' });
  }
}
