import { Directive, ElementRef, Renderer2, inject, effect } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

@Directive({
  selector: '[appRtl]'
})
export class RtlDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private translationService = inject(TranslationService);

  constructor() {
    effect(() => {
      const isRtl = this.translationService.currentLang() === 'ar';
      if (isRtl) {
        this.renderer.addClass(this.el.nativeElement, 'rtl-layout');
        this.renderer.setAttribute(this.el.nativeElement, 'dir', 'rtl');
      } else {
        this.renderer.removeClass(this.el.nativeElement, 'rtl-layout');
        this.renderer.setAttribute(this.el.nativeElement, 'dir', 'ltr');
      }
    });
  }
}
