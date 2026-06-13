import { Directive, ElementRef, Renderer2, inject, AfterViewInit } from '@angular/core';

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

@Directive({
  selector: '[appAutoDir]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class AutoDirectionDirective implements AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  ngAfterViewInit(): void {
    this.applyDirection(this.getNativeValue());
  }

  onInput(event: Event): void {
    this.applyDirection((event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  private applyDirection(value: string): void {
    const dir = this.detectDirection(value);
    const native = this.el.nativeElement;
    this.renderer.setAttribute(native, 'dir', dir);
    this.renderer.setStyle(native, 'text-align', dir === 'rtl' ? 'right' : 'left');
  }

  private detectDirection(value: string): 'rtl' | 'ltr' {
    const trimmed = value.trim();
    if (!trimmed) return 'ltr';
    const firstChar = trimmed.charAt(0);
    return ARABIC_REGEX.test(firstChar) ? 'rtl' : 'ltr';
  }

  private getNativeValue(): string {
    const native = this.el.nativeElement;
    if (native.value !== undefined) return native.value as string;
    if (native.textContent !== undefined) return native.textContent as string;
    return '';
  }
}
