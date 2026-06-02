import { Directive, ElementRef, Input, OnInit, Renderer2, inject } from '@angular/core';

@Directive({
  selector: 'img[appLazyImage]'
})
export class LazyImageDirective implements OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input('appLazyImage') src!: string;
  @Input() placeholder = 'assets/images/image-placeholder.svg';

  ngOnInit(): void {
    this.renderer.setAttribute(this.el.nativeElement, 'src', this.placeholder);
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 0.3s ease-in-out');

    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.disconnect();
          }
        });
      });
      observer.observe(this.el.nativeElement);
    } else {
      this.loadImage();
    }
  }

  private loadImage(): void {
    if (!this.src) {
      return;
    }
    const img = new Image();
    img.src = this.src;
    img.onload = () => {
      this.renderer.setAttribute(this.el.nativeElement, 'src', this.src);
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    };
  }
}
