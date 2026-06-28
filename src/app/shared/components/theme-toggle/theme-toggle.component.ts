import {
  Component,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  afterNextRender,
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

  /* ── Interactive state signals ── */
  protected readonly isHovered = signal(false);
  protected readonly isPressed = signal(false);
  protected readonly isSliding = signal(false);
  protected readonly rippleActive = signal(false);
  protected readonly prefersReducedMotion = signal(false);

  /* ── Directional sky time-lapse flags ── */
  protected readonly isChangingToDark = signal(false);
  protected readonly isChangingToLight = signal(false);

  /* ── Normalised mouse coordinates (-1 … 1) ── */
  protected readonly mouseX = signal(0);
  protected readonly mouseY = signal(0);

  /* ── Internal timeout handles ── */
  private slidingTimer: ReturnType<typeof setTimeout> | null = null;
  private rippleTimer: ReturnType<typeof setTimeout> | null = null;
  private directionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.prefersReducedMotion.set(
          window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        );
      }
    });
  }

  /* ────────────────────────────────────────────
   *  Hover / pointer tracking
   * ──────────────────────────────────────────── */

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

  /* ────────────────────────────────────────────
   *  Click / keyboard activation
   * ──────────────────────────────────────────── */

  protected onToggleTheme(event: MouseEvent): void {
    this.triggerToggle(event.clientX, event.clientY);
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      this.triggerToggle(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
  }

  /* ────────────────────────────────────────────
   *  Computed transforms (signals → CSS strings)
   * ──────────────────────────────────────────── */

  /** 3-D perspective tilt for the entire capsule on hover. */
  protected readonly parallaxTransform = computed(() => {
    if (!this.isHovered() || this.prefersReducedMotion()) {
      return 'translate3d(0,0,0) scale3d(1,1,1)';
    }
    const tx = this.mouseX() * 3;
    const ty = this.mouseY() * 2;
    const rx = -this.mouseY() * 6;
    const ry = this.mouseX() * 6;
    return `translate3d(${tx}px, ${ty - 2}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.04, 1.04, 1.04)`;
  });

  /** Day-layer parallax (clouds, balloon). */
  protected readonly cloudParallaxTransform = computed(() => {
    if (this.prefersReducedMotion()) return 'translate3d(0,0,0)';
    return `translate3d(${-this.mouseX() * 5}px, ${-this.mouseY() * 2.5}px, 0)`;
  });

  /** Night-layer parallax (stars, rocket, planets). */
  protected readonly spaceParallaxTransform = computed(() => {
    if (this.prefersReducedMotion()) return 'translate3d(0,0,0)';
    return `translate3d(${-this.mouseX() * 8}px, ${-this.mouseY() * 4}px, 0)`;
  });

  /**
   * Knob translation — slides 79 px (140 − 46 − 2 × 5 − border).
   * Adds a small magnetic hover offset.
   */
  protected readonly knobTransform = computed(() => {
    const travel = this.themeService.isDarkSignal() ? 79 : 0;
    if (this.prefersReducedMotion()) return `translate3d(${travel}px, 0, 0)`;
    const hover = this.isHovered() ? this.mouseX() * 3 : 0;
    return `translate3d(${travel + hover}px, 0, 0)`;
  });

  /* ────────────────────────────────────────────
   *  Private — orchestrate toggle micro-interactions
   * ──────────────────────────────────────────── */

  private triggerToggle(clientX: number, clientY: number): void {
    if (this.isSliding()) return;

    if (this.prefersReducedMotion()) {
      this.themeService.toggleTheme();
      return;
    }

    const goingDark = !this.themeService.isDarkSignal();

    // 1. Knob sliding state (elastic squish)
    this.clearTimer('slidingTimer');
    this.isSliding.set(true);
    this.slidingTimer = setTimeout(() => this.isSliding.set(false), 1200);

    // 2. Directional sky time-lapse flags
    this.clearTimer('directionTimer');
    this.isChangingToDark.set(goingDark);
    this.isChangingToLight.set(!goingDark);
    this.directionTimer = setTimeout(() => {
      this.isChangingToDark.set(false);
      this.isChangingToLight.set(false);
    }, 1300);

    // 3. Ripple burst
    this.clearTimer('rippleTimer');
    this.rippleActive.set(false);
    requestAnimationFrame(() => {
      this.rippleActive.set(true);
      this.rippleTimer = setTimeout(() => this.rippleActive.set(false), 750);
    });

    // 4. Global theme change with page-wide reveal
    this.themeService.toggleThemeWithReveal(clientX, clientY);
  }

  private clearTimer(key: 'slidingTimer' | 'rippleTimer' | 'directionTimer'): void {
    if (this[key]) {
      clearTimeout(this[key]!);
      this[key] = null;
    }
  }
}
