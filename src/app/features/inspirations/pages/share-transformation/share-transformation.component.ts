import {
  Component,
  OnInit,
  OnDestroy,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { InspirationsService } from '../../services/inspirations.service';
import { OrdersApiService } from '../../../orders/data-access/orders-api.service';
import { IOrder } from '../../../orders/interfaces';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

/** Lightweight ViewModel for the image preview */
interface ImagePreview {
  name: string;
  url: string;
}

@Component({
  selector: 'app-share-transformation',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './share-transformation.component.html',
  styleUrl: './share-transformation.component.css',
})
export class ShareTransformationComponent implements OnInit, OnDestroy {
  // ── Injected dependencies ──
  private readonly inspirationsService = inject(InspirationsService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly toast = inject(NotificationService);
  readonly translationService = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);

  // ── Order loading state ──
  readonly loadingOrders = signal(false);
  readonly completedOrders = signal<IOrder[]>([]);
  readonly selectedOrderId = signal<string | null>(null);

  // ── File state ──
  readonly beforeFiles = signal<File[]>([]);
  readonly afterFiles = signal<File[]>([]);

  // ── Preview URLs (need manual revoke on destroy) ──
  readonly beforePreviews = signal<ImagePreview[]>([]);
  readonly afterPreviews = signal<ImagePreview[]>([]);

  // ── Drag state ──
  readonly beforeDragOver = signal(false);
  readonly afterDragOver = signal(false);

  // ── Submission state ──
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly formTouched = signal(false);

  // ── Object URLs to revoke on destroy ──
  private objectUrls: string[] = [];

  // ── Computed validations ──
  readonly showCountMismatch = computed(() => {
    const bLen = this.beforeFiles().length;
    const aLen = this.afterFiles().length;
    return bLen > 0 && aLen > 0 && bLen !== aLen;
  });

  readonly isFormValid = computed(() => {
    const orderId = this.selectedOrderId();
    const bLen = this.beforeFiles().length;
    const aLen = this.afterFiles().length;
    return !!orderId && bLen > 0 && aLen > 0 && bLen === aLen;
  });

  // ── Lifecycle ──
  ngOnInit(): void {
    this.loadCompletedOrders();
  }

  ngOnDestroy(): void {
    this.revokeAllUrls();
  }

  // ── Load completed orders ──
  private loadCompletedOrders(): void {
    this.loadingOrders.set(true);
    this.ordersApi.getMyOrders().subscribe({
      next: (orders) => {
        const completed = orders.filter(
          (o) => o.status === 'delivered'
        );
        this.completedOrders.set(completed);
        this.loadingOrders.set(false);
      },
      error: () => {
        this.completedOrders.set([]);
        this.loadingOrders.set(false);
      },
    });
  }

  // ── Order dropdown change ──
  onOrderChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedOrderId.set(target.value || null);
    this.formTouched.set(true);
  }

  // ── Drag & drop handlers ──
  onDragOver(event: DragEvent, zone: 'before' | 'after'): void {
    event.preventDefault();
    event.stopPropagation();
    if (zone === 'before') this.beforeDragOver.set(true);
    else this.afterDragOver.set(true);
  }

  onDragLeave(zone: 'before' | 'after'): void {
    if (zone === 'before') this.beforeDragOver.set(false);
    else this.afterDragOver.set(false);
  }

  onDrop(event: DragEvent, zone: 'before' | 'after'): void {
    event.preventDefault();
    event.stopPropagation();
    this.onDragLeave(zone);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith('image/')
    );
    this.addFiles(imageFiles, zone);
  }

  // ── File input change ──
  onFilesSelected(event: Event, zone: 'before' | 'after'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const imageFiles = Array.from(input.files).filter((f) =>
      f.type.startsWith('image/')
    );
    this.addFiles(imageFiles, zone);

    // Reset input so selecting the same file again triggers change
    input.value = '';
  }

  // ── Add files and generate previews ──
  private addFiles(newFiles: File[], zone: 'before' | 'after'): void {
    if (!isPlatformBrowser(this.platformId) || newFiles.length === 0) return;

    const existingFiles = zone === 'before' ? this.beforeFiles() : this.afterFiles();
    const existingPreviews = zone === 'before' ? this.beforePreviews() : this.afterPreviews();

    const addedPreviews: ImagePreview[] = newFiles.map((file) => {
      const url = URL.createObjectURL(file);
      this.objectUrls.push(url);
      return { name: file.name, url };
    });

    if (zone === 'before') {
      this.beforeFiles.set([...existingFiles, ...newFiles]);
      this.beforePreviews.set([...existingPreviews, ...addedPreviews]);
    } else {
      this.afterFiles.set([...existingFiles, ...newFiles]);
      this.afterPreviews.set([...existingPreviews, ...addedPreviews]);
    }

    this.formTouched.set(true);
  }

  // ── Remove a single file ──
  removeFile(index: number, zone: 'before' | 'after'): void {
    if (zone === 'before') {
      const files = [...this.beforeFiles()];
      const previews = [...this.beforePreviews()];
      const removed = previews.splice(index, 1);
      files.splice(index, 1);
      this.revokeUrls(removed);
      this.beforeFiles.set(files);
      this.beforePreviews.set(previews);
    } else {
      const files = [...this.afterFiles()];
      const previews = [...this.afterPreviews()];
      const removed = previews.splice(index, 1);
      files.splice(index, 1);
      this.revokeUrls(removed);
      this.afterFiles.set(files);
      this.afterPreviews.set(previews);
    }
  }

  // ── Submit ──
  onSubmit(): void {
    this.formTouched.set(true);
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    formData.append('OrderId', this.selectedOrderId()!);

    this.beforeFiles().forEach((file) =>
      formData.append('BeforeImages', file)
    );
    this.afterFiles().forEach((file) =>
      formData.append('AfterImages', file)
    );

    this.inspirationsService.createInspiration(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.submitted.set(true);
        this.toast.success(
          'SHARE_TRANSFORMATION.SUCCESS_TOAST'
        );
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.extractErrorMessage(err));
      },
    });
  }

  // ── Reset form for a new submission ──
  resetForm(): void {
    this.revokeAllUrls();
    this.selectedOrderId.set(null);
    this.beforeFiles.set([]);
    this.afterFiles.set([]);
    this.beforePreviews.set([]);
    this.afterPreviews.set([]);
    this.submitError.set(null);
    this.submitted.set(false);
    this.formTouched.set(false);
  }

  // ── Error extraction ──
  private extractErrorMessage(err: HttpErrorResponse): string {
    if (err.status === 401) {
      return this.translationService.translate('SHARE_TRANSFORMATION.ERROR_UNAUTHORIZED');
    }
    if (err.status === 403) {
      return this.translationService.translate('SHARE_TRANSFORMATION.ERROR_FORBIDDEN');
    }
    if (err.status === 404) {
      return this.translationService.translate('SHARE_TRANSFORMATION.ERROR_NOT_FOUND');
    }
    if (err.status === 400) {
      // Try to extract backend validation errors
      const body = err.error;
      if (typeof body === 'string') return body;
      if (body?.errors) {
        const msgs: string[] = [];
        for (const key of Object.keys(body.errors)) {
          const fieldErrors = body.errors[key];
          if (Array.isArray(fieldErrors)) {
            msgs.push(...fieldErrors);
          }
        }
        if (msgs.length > 0) return msgs.join(' ');
      }
      if (body?.title) return body.title;
      if (body?.message) return body.message;
    }
    return this.translationService.translate('SHARE_TRANSFORMATION.ERROR_GENERIC');
  }

  // ── URL cleanup ──
  private revokeUrls(previews: ImagePreview[]): void {
    previews.forEach((p) => {
      URL.revokeObjectURL(p.url);
      this.objectUrls = this.objectUrls.filter((u) => u !== p.url);
    });
  }

  private revokeAllUrls(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}
