import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { VendorWalletService } from '../../services/vendor-wallet.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-vendor-wallet',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslatePipe,
    CurrencyFormatPipe,
    SkeletonLoader,
    ModalComponent
  ],
  templateUrl: './vendor-wallet.component.html',
  styleUrl: './vendor-wallet.component.css',
  changeDetection: ChangeDetectionStrategy.Default
})
export class VendorWalletComponent implements OnInit {
  private readonly walletService = inject(VendorWalletService);
  protected readonly translationService = inject(TranslationService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly wallet = this.walletService.walletSignal;
  readonly withdrawals = this.walletService.withdrawalsSignal;
  readonly isLoading = this.walletService.loadingSignal;
  readonly errorMsg = this.walletService.errorSignal;

  withdrawForm!: FormGroup;
  showWithdrawModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  actionError = signal<string | null>(null);

  ngOnInit(): void {
    // Initial fetch of wallet details and withdrawals
    this.walletService.fetchWallet().subscribe();
    this.walletService.fetchWithdrawals().subscribe();

    this.withdrawForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(10)]],
      walletNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]] // Valid Egyptian Mobile Wallet number format
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.withdrawForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  openWithdrawDialog(): void {
    this.withdrawForm.reset();
    this.actionError.set(null);
    this.showWithdrawModal.set(true);
  }

  onSubmitWithdraw(): void {
    if (this.withdrawForm.invalid) {
      this.withdrawForm.markAllAsTouched();
      return;
    }

    const amount = this.withdrawForm.value.amount;
    const balance = this.wallet()?.availableBalance || 0;

    if (amount > balance) {
      this.actionError.set(
        this.translationService.currentLang() === 'ar'
          ? 'المبلغ المطلوب سحبه يتجاوز الرصيد المتاح في محفظتك.'
          : 'The requested withdrawal amount exceeds your available wallet balance.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.actionError.set(null);

    this.walletService.requestWithdrawal(this.withdrawForm.value).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notificationService.success(
            this.translationService.currentLang() === 'ar'
              ? 'تم تقديم طلب السحب بنجاح وجاري تحويل المبلغ.'
              : 'Withdrawal request submitted successfully and payout is complete.'
          );
          this.showWithdrawModal.set(false);
          this.withdrawForm.reset();
        } else {
          this.actionError.set(res.message);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errMsg = err?.error?.message || err?.error?.Message || 'An error occurred. Mobile Wallet Payout failed.';
        this.actionError.set(errMsg);
      }
    });
  }
}
export default VendorWalletComponent;
