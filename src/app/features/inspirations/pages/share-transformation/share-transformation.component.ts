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
import { Router, RouterLink } from '@angular/router';

import { InspirationsService } from '../../services/inspirations.service';
import { OrdersApiService } from '../../../orders/data-access/orders-api.service';
import { IOrder } from '../../../orders/interfaces';
import { NotificationService } from '../../../../shared/services/notification.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

export interface TransformationPair {
  id: string;
  beforeFile: File | null;
  beforePreviewUrl: string | null;
  afterFile: File | null;
  afterPreviewUrl: string | null;
  beforeDragOver: boolean;
  afterDragOver: boolean;
}

@Component({
  selector: 'app-share-transformation',
  standalone: true,
  imports: [CommonModule, TranslatePipe, RouterLink],
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
  private readonly router = inject(Router);

  // ── Order loading state ──
  readonly loadingOrders = signal(false);
  readonly completedOrders = signal<IOrder[]>([]);
  readonly selectedOrderId = signal<string | null>(null);

  // ── Transformation pairs state ──
  readonly pairs = signal<TransformationPair[]>([this.createNewPair()]);

  // ── Submission state ──
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitted = signal(false);
  readonly formTouched = signal(false);

  // ── Object URLs to revoke on destroy ──
  private objectUrls: string[] = [];

  // ── Computed validations & details ──
  readonly selectedOrder = computed(() => {
    const orderId = this.selectedOrderId();
    if (!orderId) return null;
    return this.completedOrders().find((o) => o.id === orderId) || null;
  });

  readonly showIncompletePairs = computed(() => {
    if (!this.formTouched()) return false;
    return this.pairs().some((p) => !p.beforeFile || !p.afterFile);
  });

  readonly showCountMismatch = computed(() => {
    if (!this.formTouched()) return false;
    return this.pairs().some((p) => (p.beforeFile && !p.afterFile) || (!p.beforeFile && p.afterFile));
  });

  readonly isFormValid = computed(() => {
    const orderId = this.selectedOrderId();
    const pairList = this.pairs();
    if (!orderId || pairList.length === 0) return false;
    return pairList.every((p) => !!p.beforeFile && !!p.afterFile);
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
        console.log('[ShareTransformation] Raw Orders API response:', orders);

        const completed = orders.filter((o) => {
          const statusLower = o.status?.toLowerCase();
          const isEligible = statusLower === 'delivered' || statusLower === 'completed';
          console.log(`[ShareTransformation] Order #${o.orderNumber} - raw status: "${o.status}", mapped lower: "${statusLower}", eligible: ${isEligible}`);
          return isEligible;
        });

        console.log('[ShareTransformation] Eligible orders count:', completed.length);
        console.log('[ShareTransformation] Final empty state active:', completed.length === 0);

        this.completedOrders.set(completed);
        this.loadingOrders.set(false);
      },
      error: (err) => {
        console.error('[ShareTransformation] Error loading orders:', err);
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

  // ── Helper: Create a new empty pair ──
  private createNewPair(): TransformationPair {
    return {
      id: 'pair_' + Math.random().toString(36).substring(2, 9),
      beforeFile: null,
      beforePreviewUrl: null,
      afterFile: null,
      afterPreviewUrl: null,
      beforeDragOver: false,
      afterDragOver: false,
    };
  }

  // ── Pair Actions ──
  addPair(): void {
    this.pairs.update((list) => [...list, this.createNewPair()]);
    this.formTouched.set(true);
  }

  removePair(pairId: string): void {
    this.pairs.update((list) => {
      const target = list.find((p) => p.id === pairId);
      if (target) {
        if (target.beforePreviewUrl) {
          URL.revokeObjectURL(target.beforePreviewUrl);
          this.objectUrls = this.objectUrls.filter((u) => u !== target.beforePreviewUrl);
        }
        if (target.afterPreviewUrl) {
          URL.revokeObjectURL(target.afterPreviewUrl);
          this.objectUrls = this.objectUrls.filter((u) => u !== target.afterPreviewUrl);
        }
      }
      const filtered = list.filter((p) => p.id !== pairId);
      return filtered.length > 0 ? filtered : [this.createNewPair()];
    });
    this.formTouched.set(true);
  }

  removeFileFromPair(pairId: string, zone: 'before' | 'after'): void {
    this.pairs.update((list) =>
      list.map((p) => {
        if (p.id !== pairId) return p;

        if (zone === 'before') {
          if (p.beforePreviewUrl) {
            URL.revokeObjectURL(p.beforePreviewUrl);
            this.objectUrls = this.objectUrls.filter((u) => u !== p.beforePreviewUrl);
          }
          return { ...p, beforeFile: null, beforePreviewUrl: null };
        } else {
          if (p.afterPreviewUrl) {
            URL.revokeObjectURL(p.afterPreviewUrl);
            this.objectUrls = this.objectUrls.filter((u) => u !== p.afterPreviewUrl);
          }
          return { ...p, afterFile: null, afterPreviewUrl: null };
        }
      })
    );
    this.formTouched.set(true);
  }

  // ── Drag & drop handlers ──
  onDragOver(event: DragEvent, pairId: string, zone: 'before' | 'after'): void {
    event.preventDefault();
    event.stopPropagation();
    this.setDragOver(pairId, zone, true);
  }

  onDragLeave(pairId: string, zone: 'before' | 'after'): void {
    this.setDragOver(pairId, zone, false);
  }

  onDrop(event: DragEvent, pairId: string, zone: 'before' | 'after'): void {
    event.preventDefault();
    event.stopPropagation();
    this.onDragLeave(pairId, zone);

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
    if (imageFile) {
      this.setFileForPair(imageFile, pairId, zone);
    }
  }

  // ── File input change ──
  onFileSelected(event: Event, pairId: string, zone: 'before' | 'after'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const imageFile = Array.from(input.files).find((f) => f.type.startsWith('image/'));
    if (imageFile) {
      this.setFileForPair(imageFile, pairId, zone);
    }
    input.value = ''; // Reset input element
  }

  private setDragOver(pairId: string, zone: 'before' | 'after', isOver: boolean): void {
    this.pairs.update((list) =>
      list.map((p) => {
        if (p.id !== pairId) return p;
        return {
          ...p,
          beforeDragOver: zone === 'before' ? isOver : p.beforeDragOver,
          afterDragOver: zone === 'after' ? isOver : p.afterDragOver,
        };
      })
    );
  }

  private setFileForPair(file: File, pairId: string, zone: 'before' | 'after'): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const url = URL.createObjectURL(file);
    this.objectUrls.push(url);

    this.pairs.update((list) =>
      list.map((p) => {
        if (p.id !== pairId) return p;

        if (zone === 'before' && p.beforePreviewUrl) {
          URL.revokeObjectURL(p.beforePreviewUrl);
          this.objectUrls = this.objectUrls.filter((u) => u !== p.beforePreviewUrl);
        } else if (zone === 'after' && p.afterPreviewUrl) {
          URL.revokeObjectURL(p.afterPreviewUrl);
          this.objectUrls = this.objectUrls.filter((u) => u !== p.afterPreviewUrl);
        }

        return {
          ...p,
          beforeFile: zone === 'before' ? file : p.beforeFile,
          beforePreviewUrl: zone === 'before' ? url : p.beforePreviewUrl,
          afterFile: zone === 'after' ? file : p.afterFile,
          afterPreviewUrl: zone === 'after' ? url : p.afterPreviewUrl,
        };
      })
    );
    this.formTouched.set(true);
  }

  // ── Submit ──
  onSubmit(): void {
    this.formTouched.set(true);
    if (!this.isFormValid() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    formData.append('OrderId', this.selectedOrderId()!);

    this.pairs().forEach((p) => {
      if (p.beforeFile) formData.append('BeforeImages', p.beforeFile);
      if (p.afterFile) formData.append('AfterImages', p.afterFile);
    });

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
    this.pairs.set([this.createNewPair()]);
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
  private revokeAllUrls(): void {
    this.pairs().forEach((p) => {
      if (p.beforePreviewUrl) URL.revokeObjectURL(p.beforePreviewUrl);
      if (p.afterPreviewUrl) URL.revokeObjectURL(p.afterPreviewUrl);
    });
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }

  // ── UI Actions ──
  goBack(): void {
    this.router.navigate(['/inspirations']);
  }

  copyShareLink(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const shareUrl = window.location.origin + '/inspirations';
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        this.toast.success('SHARE_TRANSFORMATION.COPY_SUCCESS');
      },
      () => {
        this.toast.error('SHARE_TRANSFORMATION.COPY_FAIL');
      }
    );
  }

  downloadImages(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.toast.info('SHARE_TRANSFORMATION.DOWNLOAD_START');
    const allFiles: File[] = [];
    this.pairs().forEach((p) => {
      if (p.beforeFile) allFiles.push(p.beforeFile);
      if (p.afterFile) allFiles.push(p.afterFile);
    });
    if (allFiles.length === 0) return;
    allFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${index + 1}_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    });
  }
}
