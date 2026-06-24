import { Component, Input, HostListener, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IInspiration } from '../../interfaces/inspiration.interface';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-inspiration-card',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './inspiration-card.component.html',
  styleUrl: './inspiration-card.component.css'
})
export class InspirationCardComponent {
  @Input({ required: true }) item!: IInspiration;
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  readonly translationService = inject(TranslationService);

  sliderPosition = 50;
  isDragging = false;
  likesCount = 0;
  hasLiked = false;

  ngOnInit() {
    this.likesCount = 0;
  }

  toggleLike(event: Event) {
    event.stopPropagation();
    if (this.hasLiked) {
      this.likesCount--;
      this.hasLiked = false;
    } else {
      this.likesCount++;
      this.hasLiked = true;
    }
  }

  startDrag(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    this.isDragging = true;
    this.updatePosition(event);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    this.updatePosition(event);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    this.updatePosition(event);
  }

  @HostListener('document:touchend')
  onTouchEnd(): void {
    this.isDragging = false;
  }

  private updatePosition(event: MouseEvent | TouchEvent): void {
    const container = this.containerRef.nativeElement;
    const rect = container.getBoundingClientRect();
    
    let clientX = 0;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches[0]) {
      clientX = event.touches[0].clientX;
    } else {
      return;
    }

    const relativeX = clientX - rect.left;
    const percentage = (relativeX / rect.width) * 100;
    this.sliderPosition = Math.max(0, Math.min(100, percentage));
  }
}
