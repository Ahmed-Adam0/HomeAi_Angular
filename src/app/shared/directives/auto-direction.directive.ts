import { Directive, ElementRef, Renderer2, inject, AfterViewInit, Input, DoCheck } from '@angular/core';

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

@Directive({
  selector: '[appAutoDir]',
  standalone: true,
  host: {
    '(input)': 'onInput($event)',
  },
})
export class AutoDirectionDirective implements AfterViewInit, DoCheck {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input('appAutoDir') defaultDir: 'rtl' | 'ltr' | '' = 'ltr';

  private lastValue = '';

  ngAfterViewInit(): void {
    const initialVal = this.getNativeValue();
    this.lastValue = initialVal;
    this.applyDirection(initialVal);
  }

  ngDoCheck(): void {
    const currentVal = this.getNativeValue();
    if (currentVal !== this.lastValue) {
      this.lastValue = currentVal;
      this.applyDirection(currentVal);
    }
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.lastValue = val;
    this.applyDirection(val);
  }

  private applyDirection(value: string): void {
    const dir = this.detectDirection(value);
    const native = this.el.nativeElement;
    this.renderer.setAttribute(native, 'dir', dir);
    this.renderer.setStyle(native, 'text-align', dir === 'rtl' ? 'right' : 'left');
  }

  private detectDirection(value: string): 'rtl' | 'ltr' {
    const trimmed = value.trim();
    if (!trimmed) {
      return this.defaultDir === 'rtl' ? 'rtl' : 'ltr';
    }
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
