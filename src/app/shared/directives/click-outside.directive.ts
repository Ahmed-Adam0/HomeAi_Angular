import {
  Directive,
  ElementRef,
  EventEmitter,
  inject,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Reusable directive that emits when a click occurs outside the host element.
 *
 * Usage:
 * ```html
 * <div (appClickOutside)="onOutsideClick()">...</div>
 * ```
 *
 * The listener is bound on the capture phase with a one-frame delay
 * so that the opening click itself is never caught.
 */
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  @Output('appClickOutside') readonly clickOutside = new EventEmitter<void>();

  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private listening = false;

  /** Bound handler reference so we can cleanly remove it. */
  private readonly onDocumentClick = (event: Event): void => {
    if (!this.listening) return;

    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.clickOutside.emit();
    }
  };

  /** Close on Escape key. */
  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.clickOutside.emit();
    }
  };

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Delay listener attachment by one animation frame so the click that
    // *opened* the host element doesn't immediately trigger a close.
    requestAnimationFrame(() => {
      this.listening = true;
      document.addEventListener('click', this.onDocumentClick, true);
      document.addEventListener('keydown', this.onDocumentKeydown, true);
    });
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    document.removeEventListener('click', this.onDocumentClick, true);
    document.removeEventListener('keydown', this.onDocumentKeydown, true);
  }
}
