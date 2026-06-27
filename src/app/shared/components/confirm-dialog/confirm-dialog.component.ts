import { Component, input, output, HostListener, effect, signal, inject, PLATFORM_ID, DestroyRef } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  imports: [],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialog {
  readonly title = input('Confirm Action');
  readonly message = input('Are you sure you want to proceed?');
  readonly confirmText = input('Confirm');
  readonly cancelText = input('Cancel');
  readonly visible = input(false);
  readonly variant = input<'danger' | 'warning' | 'info'>('danger');

  readonly confirm = output<void>();
  readonly cancel = output<void>();
  readonly close = output<void>();

  /** Internal state to drive the closing animation before removal */
  readonly closing = signal(false);
  /** Whether the overlay is actually rendered in the DOM */
  readonly showOverlay = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private closingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // React to visibility changes: lock body scroll and manage animation state
    effect(() => {
      const isVisible = this.visible();

      if (isPlatformBrowser(this.platformId)) {
        if (isVisible) {
          // Opening: show overlay immediately, clear any pending close timer
          if (this.closingTimer) {
            clearTimeout(this.closingTimer);
            this.closingTimer = null;
          }
          this.closing.set(false);
          this.showOverlay.set(true);
          this.document.body.style.overflow = 'hidden';
        } else if (this.showOverlay()) {
          // Closing: trigger close animation, then remove from DOM
          this.closing.set(true);
          this.closingTimer = setTimeout(() => {
            this.showOverlay.set(false);
            this.closing.set(false);
            this.closingTimer = null;
          }, 200); // Match the CSS close animation duration
          this.document.body.style.overflow = '';
        }
      }
    });

    // Cleanup on destroy: restore body scroll and clear timers
    this.destroyRef.onDestroy(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.document.body.style.overflow = '';
      }
      if (this.closingTimer) {
        clearTimeout(this.closingTimer);
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.onCancel();
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onCancel();
  }
}
