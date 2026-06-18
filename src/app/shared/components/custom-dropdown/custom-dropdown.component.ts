import { Component, Input, Output, EventEmitter, ElementRef, HostListener, inject, signal, PLATFORM_ID, OnDestroy, Renderer2 } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-custom-dropdown',
  standalone: true,
  imports: [],
  templateUrl: './custom-dropdown.component.html',
  styleUrl: './custom-dropdown.component.css'
})
export class CustomDropdownComponent implements OnDestroy {
  private elementRef = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);
  private renderer = inject(Renderer2);

  @Input({ required: true }) options: { value: any; label: string }[] = [];
  @Input() value: any = null;
  @Input() placeholder: string = '';
  @Input() disabled: boolean = false;

  @Output() valueChange = new EventEmitter<any>();

  readonly isOpen = signal<boolean>(false);

  private portalEl: HTMLElement | null = null;
  private clickCleanup: (() => void) | null = null;

  toggleDropdown(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.createPortal();
    }
    this.isOpen.set(true);
  }

  private close(): void {
    this.isOpen.set(false);
    this.destroyPortal();
  }

  private createPortal(): void {
    this.destroyPortal();

    const trigger = this.elementRef.nativeElement.querySelector('.dropdown-trigger') as HTMLElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();

    this.portalEl = this.renderer.createElement('div');
    this.renderer.addClass(this.portalEl, 'dropdown-portal');

    this.renderer.setStyle(this.portalEl, 'position', 'fixed');
    this.renderer.setStyle(this.portalEl, 'top', `${rect.bottom + 6}px`);
    this.renderer.setStyle(this.portalEl, 'left', `${rect.left}px`);
    this.renderer.setStyle(this.portalEl, 'width', `${rect.width}px`);
    this.renderer.setStyle(this.portalEl, 'z-index', '100000');

    const ul = this.renderer.createElement('ul');
    this.renderer.addClass(ul, 'dropdown-portal-options');

    for (const opt of this.options) {
      const li = this.renderer.createElement('li');
      this.renderer.addClass(li, 'dropdown-portal-option');
      if (opt.value === this.value) {
        this.renderer.addClass(li, 'selected');
      }
      this.renderer.setProperty(li, 'innerText', opt.label);
      this.renderer.listen(li, 'click', () => this.selectOption(opt.value));
      this.renderer.appendChild(ul, li);
    }

    this.renderer.appendChild(this.portalEl, ul);
    this.renderer.appendChild(document.body, this.portalEl);

    this.listenOutsideClick();
  }

  private destroyPortal(): void {
    if (this.portalEl && this.portalEl.parentNode) {
      this.renderer.removeChild(this.portalEl.parentNode, this.portalEl);
    }
    this.portalEl = null;
    if (this.clickCleanup) {
      this.clickCleanup();
      this.clickCleanup = null;
    }
  }

  private listenOutsideClick(): void {
    this.clickCleanup = this.renderer.listen('document', 'mousedown', (event: MouseEvent) => {
      if (!this.isOpen()) return;
      const target = event.target as Node;
      const isInsideComponent = this.elementRef.nativeElement.contains(target);
      const isInsidePortal = this.portalEl && this.portalEl.contains(target);
      if (!isInsideComponent && !isInsidePortal) {
        this.close();
      }
    });
  }

  selectOption(optionValue: any): void {
    if (this.disabled) return;
    this.value = optionValue;
    this.valueChange.emit(optionValue);
    this.close();
  }

  get selectedLabel(): string {
    const selected = this.options.find(opt => opt.value === this.value);
    return selected ? selected.label : this.placeholder;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.close();
  }

  ngOnDestroy(): void {
    this.destroyPortal();
  }
}
