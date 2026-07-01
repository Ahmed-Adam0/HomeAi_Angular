import { Component, Input, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  sliderPosition = 50;
  isDragging = false;

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
