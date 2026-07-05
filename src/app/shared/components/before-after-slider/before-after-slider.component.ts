import { Component, Input, HostListener, ElementRef, ViewChild, NgZone, Renderer2, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-before-after-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './before-after-slider.component.html',
  styleUrl: './before-after-slider.component.css',
})
export class BeforeAfterSliderComponent {
  @Input({ required: true }) beforeImageUrl!: string;
  @Input({ required: true }) afterImageUrl!: string;
  @Input() beforeLabel?: string;
  @Input() afterLabel?: string;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageBefore', { static: false }) imageBeforeRef?: ElementRef<HTMLImageElement>;
  @ViewChild('sliderHandle', { static: false }) sliderHandleRef?: ElementRef<HTMLDivElement>;
  @ViewChild('badgeBefore', { static: false }) badgeBeforeRef?: ElementRef<HTMLSpanElement>;

  sliderPosition = 50;
  isDragging = false;
  private animationFrameId: number | null = null;
  private currentClientX: number | null = null;
  private unlistenMove?: () => void;
  private unlistenUp?: () => void;
  private unlistenCancel?: () => void;

  constructor(
    private ngZone: NgZone,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  startDrag(event: PointerEvent | MouseEvent | TouchEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Only prevent default on touch events if needed, but touch-action: none in CSS handles it better
    if (event.cancelable && !(event instanceof PointerEvent)) {
      // event.preventDefault();
    }
    
    this.isDragging = true;
    this.currentClientX = this.getClientX(event);
    
    // Run outside Angular to prevent Change Detection on every pixel movement
    this.ngZone.runOutsideAngular(() => {
      if (event.type.includes('touch')) {
        this.unlistenMove = this.renderer.listen('document', 'touchmove', this.onMove.bind(this));
        this.unlistenUp = this.renderer.listen('document', 'touchend', this.stopDrag.bind(this));
        this.unlistenCancel = this.renderer.listen('document', 'touchcancel', this.stopDrag.bind(this));
      } else {
        this.unlistenMove = this.renderer.listen('document', 'pointermove', this.onMove.bind(this));
        this.unlistenUp = this.renderer.listen('document', 'pointerup', this.stopDrag.bind(this));
        this.unlistenCancel = this.renderer.listen('document', 'pointercancel', this.stopDrag.bind(this));
      }
      this.queueUpdate();
    });
  }

  private onMove(event: PointerEvent | MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;
    
    // Prevent scrolling while dragging
    if (event.cancelable && event.type === 'touchmove') {
      event.preventDefault();
    }
    
    this.currentClientX = this.getClientX(event);
    this.queueUpdate();
  }

  private stopDrag(): void {
    this.ngZone.run(() => {
      this.isDragging = false;
    });
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.unlistenMove) { this.unlistenMove(); this.unlistenMove = undefined; }
    if (this.unlistenUp) { this.unlistenUp(); this.unlistenUp = undefined; }
    if (this.unlistenCancel) { this.unlistenCancel(); this.unlistenCancel = undefined; }
  }

  private getClientX(event: PointerEvent | MouseEvent | TouchEvent): number {
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      return (event as MouseEvent).clientX;
    } else if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
      if (event.touches && event.touches.length > 0) {
        return event.touches[0].clientX;
      }
    }
    // Fallback for generic event objects that might have touches array
    if ((event as any).touches && (event as any).touches.length > 0) {
      return (event as any).touches[0].clientX;
    }
    return 0;
  }

  private queueUpdate(): void {
    if (this.animationFrameId === null) {
      this.animationFrameId = requestAnimationFrame(() => {
        this.updatePosition();
        this.animationFrameId = null;
      });
    }
  }

  private updatePosition(): void {
    if (this.currentClientX === null) return;
    
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();

    const relativeX = this.currentClientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    this.sliderPosition = Math.max(0, Math.min(100, percentage));
    
    // Update DOM directly to bypass Angular Change Detection overhead
    const clipPath = `inset(0 ${100 - this.sliderPosition}% 0 0)`;
    
    if (this.imageBeforeRef?.nativeElement) {
      this.renderer.setStyle(this.imageBeforeRef.nativeElement, 'clip-path', clipPath);
    }
    
    if (this.sliderHandleRef?.nativeElement) {
      this.renderer.setStyle(this.sliderHandleRef.nativeElement, 'left', `${this.sliderPosition}%`);
    }
    
    if (this.badgeBeforeRef?.nativeElement) {
      const opacity = this.sliderPosition > 15 ? '1' : '0';
      this.renderer.setStyle(this.badgeBeforeRef.nativeElement, 'opacity', opacity);
    }
  }

  ngOnDestroy(): void {
    this.stopDrag();
  }
}
