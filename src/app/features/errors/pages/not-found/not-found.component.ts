import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {
  // Signals for tracking mouse position (parallax coordinates normalized from -1 to 1)
  mouseX = signal(0);
  mouseY = signal(0);

  // Easter Egg States
  lampOn = signal(true);
  chairSpinned = signal(false);
  sofaFloated = signal(false);
  shelfFlipped = signal(false);
  tableHovered = signal(false);

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    // Check if the user prefers reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      if (this.mouseX() !== 0 || this.mouseY() !== 0) {
        this.mouseX.set(0);
        this.mouseY.set(0);
      }
      return;
    }

    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    this.mouseX.set(x);
    this.mouseY.set(y);
  }

  // Interactive Easter Egg Actions
  toggleLamp(event: Event) {
    event.stopPropagation();
    this.lampOn.update(state => !state);
  }

  spinChair(event: Event) {
    event.stopPropagation();
    if (!this.chairSpinned()) {
      this.chairSpinned.set(true);
      setTimeout(() => this.chairSpinned.set(false), 1200); // Animation duration
    }
  }

  floatSofa(event: Event) {
    event.stopPropagation();
    if (!this.sofaFloated()) {
      this.sofaFloated.set(true);
      setTimeout(() => this.sofaFloated.set(false), 1400); // Animation duration
    }
  }

  flipShelf(event: Event) {
    event.stopPropagation();
    if (!this.shelfFlipped()) {
      this.shelfFlipped.set(true);
      setTimeout(() => this.shelfFlipped.set(false), 1000);
    }
  }

  setTableHover(isHovered: boolean) {
    this.tableHovered.set(isHovered);
  }
}

