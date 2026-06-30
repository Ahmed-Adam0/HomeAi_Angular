import { Component, input, output, HostListener, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css'
})
export class ModalComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly title = input('');
  readonly visible = input(false);
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly close = output<void>();

  constructor() {
    effect((onCleanup) => {
      if (!isPlatformBrowser(this.platformId)) return;
      const isVisible = this.visible();
      const prev = document.body.style.overflow;
      if (isVisible) {
        document.body.style.overflow = 'hidden';
      }
      onCleanup(() => {
        if (isVisible) {
          document.body.style.overflow = prev;
        }
      });
    });
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    if (this.visible()) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onBackdropClick(): void {
    this.onClose();
  }
}
