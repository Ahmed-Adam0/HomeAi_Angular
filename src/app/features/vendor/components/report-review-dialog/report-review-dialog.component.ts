import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-report-review-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LocalizedPipe],
  templateUrl: './report-review-dialog.component.html',
  styleUrl: './report-review-dialog.component.css'
})
export class ReportReviewDialog implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() reviewId: number | string | null = null;
  @Input() isSubmitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() submitReport = new EventEmitter<{ reason: string; notes: string }>();

  readonly translationService = inject(TranslationService);
  private fb = inject(FormBuilder);

  reportForm: FormGroup;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      const isVisible = changes['visible'].currentValue;
      if (typeof document !== 'undefined') {
        if (isVisible) {
          document.body.classList.add('modal-open');
        } else {
          document.body.classList.remove('modal-open');
        }
      }
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('modal-open');
    }
  }

  readonly reasons = [
    { value: 'Abuse', labelEn: 'Abuse', labelAr: 'إساءة استخدام' },
    { value: 'Hate Speech', labelEn: 'Hate Speech', labelAr: 'خطاب كراهية' },
    { value: 'Spam', labelEn: 'Spam / Advertising', labelAr: 'محتوى غير مرغوب فيه / إعلانات' },
    { value: 'Harassment', labelEn: 'Harassment', labelAr: 'مضايقة' },
    { value: 'Fake Review', labelEn: 'Fake Review', labelAr: 'تقييم زائف' },
    { value: 'Offensive Language', labelEn: 'Offensive Language', labelAr: 'لغة مسيئة' },
    { value: 'Other', labelEn: 'Other Reason', labelAr: 'سبب آخر' }
  ];

  constructor() {
    this.reportForm = this.fb.group({
      reason: ['', Validators.required],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  onClose(): void {
    this.reportForm.reset();
    this.close.emit();
  }

  onSubmit(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }
    this.submitReport.emit(this.reportForm.value);
    this.reportForm.reset();
  }

  isInvalid(controlName: string): boolean {
    const control = this.reportForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
