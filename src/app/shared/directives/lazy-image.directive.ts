import { Directive, ElementRef, Input, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: 'img[appLazyImage]',
  standalone: true,
})
export class LazyImageDirective implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  @Input('appLazyImage') src!: string;
  
  // Transparent 1x1 pixel spacer to avoid broken image borders before loading finishes
  private readonly transparentSpacer = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  ngOnInit(): void {
    const nativeElement = this.el.nativeElement;

    // Apply initial loading properties
    this.renderer.setAttribute(nativeElement, 'src', this.transparentSpacer);
    this.renderer.addClass(nativeElement, 'fm-skeleton');
    this.renderer.addClass(nativeElement, 'fm-gpu-optimize');
    this.renderer.setStyle(nativeElement, 'opacity', '0');
    this.renderer.setStyle(nativeElement, 'transition', 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)');

    // Lazy load using IntersectionObserver
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.disconnect();
          }
        });
      });
      observer.observe(nativeElement);
    } else {
      this.loadImage();
    }
  }

  private loadImage(): void {
    const nativeElement = this.el.nativeElement;

    if (!this.src) {
      this.renderer.removeClass(nativeElement, 'fm-skeleton');
      this.renderer.setAttribute(nativeElement, 'src', 'assets/images/image-placeholder.svg');
      this.renderer.setStyle(nativeElement, 'opacity', '1');
      return;
    }

    const img = new Image();
    img.src = this.src;
    
    img.onload = () => {
      // Transition out shimmer & fade in actual image content
      this.renderer.removeClass(nativeElement, 'fm-skeleton');
      this.renderer.setAttribute(nativeElement, 'src', this.src);
      
      // Delay slightly for visual fluid overlap
      setTimeout(() => {
        this.renderer.setStyle(nativeElement, 'opacity', '1');
      }, 50);
    };

    img.onerror = () => {
      // Clean up skeleton styling on error and apply fallback asset
      this.renderer.removeClass(nativeElement, 'fm-skeleton');
      this.renderer.setAttribute(nativeElement, 'src', 'assets/images/image-placeholder.svg');
      this.renderer.setStyle(nativeElement, 'opacity', '1');
      console.warn(`Failed to load product image asset from path: "${this.src}". Applied fallback placeholder.`);
    };
  }
}
