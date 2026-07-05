import { Injectable, ElementRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MobileScrollService {
  private scrollContainer: ElementRef<HTMLElement> | null = null;

  registerScrollContainer(container: ElementRef<HTMLElement>): void {
    this.scrollContainer = container;
  }

  scrollToTop(behavior: ScrollBehavior = 'smooth'): void {
    if (this.scrollContainer && this.scrollContainer.nativeElement) {
      this.scrollContainer.nativeElement.scrollTo({ top: 0, behavior });
    }
  }
}
