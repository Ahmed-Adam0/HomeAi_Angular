import {
  Component,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  afterNextRender,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [NgIf],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.css',
})
export class ThemeToggleComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly elementRef = inject(ElementRef);

  /* ── Interactive states ── */
  protected readonly isHovered = signal(false);
  protected readonly isPressed = signal(false);
  protected readonly isSliding = signal(false);
  protected readonly prefersReducedMotion = signal(false);

  /* ── Mouse tracking for micro 3D tilt ── */
  protected readonly mouseX = signal(0);
  protected readonly mouseY = signal(0);

  private slidingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.prefersReducedMotion.set(
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );
      }
    });
  }

  /* ── Event handlers ── */

  protected onMouseEnter(): void {
    this.isHovered.set(true);
  }

  protected onMouseMove(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId) || this.prefersReducedMotion()) return;
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    this.mouseX.set((event.clientX - rect.left - rect.width / 2) / (rect.width / 2));
    this.mouseY.set((event.clientY - rect.top - rect.height / 2) / (rect.height / 2));
  }

  protected onMouseLeave(): void {
    this.isHovered.set(false);
    this.isPressed.set(false);
    this.mouseX.set(0);
    this.mouseY.set(0);
  }

  protected onMouseDown(e: MouseEvent): void {
    if (e.button === 0) this.isPressed.set(true);
  }

  protected onMouseUp(): void {
    this.isPressed.set(false);
  }

  protected onToggleTheme(event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    this.triggerToggle(x, y);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const el = this.elementRef.nativeElement.querySelector('.luxury-toggle');
      if (el) {
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        this.triggerToggle(x, y);
      } else {
        this.triggerToggle();
      }
    }
  }

  /* ── Computed transforms ── */

  /** Hover: Slight lift (translateY(-2px)) and 3D tilt */
  protected readonly parallaxTransform = computed(() => {
    if (!this.isHovered() || this.prefersReducedMotion()) {
      return 'translate3d(0, 0, 0) scale3d(1, 1, 1)';
    }
    const rx = -this.mouseY() * 2;
    const ry = this.mouseX() * 2;
    return `translate3d(0, -2px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02, 1.02, 1.02)`;
  });

  /**
   * Slides the circular floating thumb:
   * Width 60px − Knob 24px − 2 × 3px padding = 30px travel distance.
   * Slides to the right (30px) in Light Mode, remains on the left (0px) in Dark Mode.
   */
  protected readonly thumbTransform = computed(() => {
    const travel = this.themeService.isDarkSignal() ? 0 : 30;
    if (this.prefersReducedMotion()) return `translate3d(${travel}px, 0, 0)`;
    const hover = this.isHovered() ? this.mouseX() * 1.2 : 0;
    return `translate3d(${travel + hover}px, 0, 0)`;
  });

  /* ── Private helpers ── */

  private triggerToggle(x?: number, y?: number): void {
    if (this.isSliding()) return;

    if (this.prefersReducedMotion()) {
      this.themeService.toggleTheme();
      return;
    }

    this.clearTimer();
    this.isSliding.set(true);
    // Slide duration aligns with the spring transition (400ms)
    this.slidingTimer = setTimeout(() => this.isSliding.set(false), 450);

    // If coordinates are provided, use them; otherwise, default to center of the viewport
    const revealX = x ?? window.innerWidth / 2;
    const revealY = y ?? window.innerHeight / 2;

    this.themeService.toggleThemeWithReveal(revealX, revealY);
  }

  private clearTimer(): void {
    if (this.slidingTimer) {
      clearTimeout(this.slidingTimer);
      this.slidingTimer = null;
    }
  }
}
