import {
  Component,
  AfterViewInit,
  ElementRef,
  inject,
  Renderer2,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import type { AboutValueData } from '../../models/about.models';

interface CounterEntry {
  key: string;
  target: number;
  icon: string;
}

interface AccordionEntry {
  titleKey: string;
  contentKey: string;
}

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent implements AfterViewInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  readonly translationService = inject(TranslationService);

  readonly values: AboutValueData[] = [
    { titleKey: 'ABOUT.VALUES.INNOVATION.TITLE', descKey: 'ABOUT.VALUES.INNOVATION.DESCRIPTION', icon: 'bi bi-robot' },
    { titleKey: 'ABOUT.VALUES.AI_POWERED.TITLE', descKey: 'ABOUT.VALUES.AI_POWERED.DESCRIPTION', icon: 'bi bi-cpu' },
    { titleKey: 'ABOUT.VALUES.CUSTOMER_FIRST.TITLE', descKey: 'ABOUT.VALUES.CUSTOMER_FIRST.DESCRIPTION', icon: 'bi bi-people' },
    { titleKey: 'ABOUT.VALUES.SECURE.TITLE', descKey: 'ABOUT.VALUES.SECURE.DESCRIPTION', icon: 'bi bi-shield-check' },
    { titleKey: 'ABOUT.VALUES.SMART_RECOMMENDATIONS.TITLE', descKey: 'ABOUT.VALUES.SMART_RECOMMENDATIONS.DESCRIPTION', icon: 'bi bi-stars' },
    { titleKey: 'ABOUT.VALUES.MODERN_MARKETPLACE.TITLE', descKey: 'ABOUT.VALUES.MODERN_MARKETPLACE.DESCRIPTION', icon: 'bi bi-shop' },
  ];

  readonly stats: CounterEntry[] = [
    { key: 'ABOUT.STATS.CUSTOMERS', target: 85000, icon: 'bi bi-person-hearts' },
    { key: 'ABOUT.STATS.PRODUCTS', target: 12500, icon: 'bi bi-box-seam' },
    { key: 'ABOUT.STATS.VENDORS', target: 480, icon: 'bi bi-building' },
    { key: 'ABOUT.STATS.ORDERS', target: 210000, icon: 'bi bi-truck' },
  ];

  readonly timelineItems = [
    { yearKey: 'ABOUT.TIMELINE.ITEM1.YEAR', titleKey: 'ABOUT.TIMELINE.ITEM1.TITLE', descKey: 'ABOUT.TIMELINE.ITEM1.DESC' },
    { yearKey: 'ABOUT.TIMELINE.ITEM2.YEAR', titleKey: 'ABOUT.TIMELINE.ITEM2.TITLE', descKey: 'ABOUT.TIMELINE.ITEM2.DESC' },
    { yearKey: 'ABOUT.TIMELINE.ITEM3.YEAR', titleKey: 'ABOUT.TIMELINE.ITEM3.TITLE', descKey: 'ABOUT.TIMELINE.ITEM3.DESC' },
    { yearKey: 'ABOUT.TIMELINE.ITEM4.YEAR', titleKey: 'ABOUT.TIMELINE.ITEM4.TITLE', descKey: 'ABOUT.TIMELINE.ITEM4.DESC' },
  ];

  readonly teamMembers = [
    { nameKey: 'ABOUT.TEAM.MEMBER1.NAME', roleKey: 'ABOUT.TEAM.MEMBER1.ROLE', icon: 'bi bi-person-workspace', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
    { nameKey: 'ABOUT.TEAM.MEMBER2.NAME', roleKey: 'ABOUT.TEAM.MEMBER2.ROLE', icon: 'bi bi-code-slash', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
    { nameKey: 'ABOUT.TEAM.MEMBER3.NAME', roleKey: 'ABOUT.TEAM.MEMBER3.ROLE', icon: 'bi bi-terminal', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
    { nameKey: 'ABOUT.TEAM.MEMBER4.NAME', roleKey: 'ABOUT.TEAM.MEMBER4.ROLE', icon: 'bi bi-cpu', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
    { nameKey: 'ABOUT.TEAM.MEMBER5.NAME', roleKey: 'ABOUT.TEAM.MEMBER5.ROLE', icon: 'bi bi-database', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
    { nameKey: 'ABOUT.TEAM.MEMBER6.NAME', roleKey: 'ABOUT.TEAM.MEMBER6.ROLE', icon: 'bi bi-bezier2', social: { facebook: 'https://www.facebook.com/share/1NUpe2SWCn/' } },
  ];

  readonly privacyItems: AccordionEntry[] = [
    { titleKey: 'ABOUT.PRIVACY.DATA_COLLECTION.TITLE', contentKey: 'ABOUT.PRIVACY.DATA_COLLECTION.DESCRIPTION' },
    { titleKey: 'ABOUT.PRIVACY.ACCOUNT_INFO.TITLE', contentKey: 'ABOUT.PRIVACY.ACCOUNT_INFO.DESCRIPTION' },
    { titleKey: 'ABOUT.PRIVACY.COOKIES.TITLE', contentKey: 'ABOUT.PRIVACY.COOKIES.DESCRIPTION' },
    { titleKey: 'ABOUT.PRIVACY.ANALYTICS.TITLE', contentKey: 'ABOUT.PRIVACY.ANALYTICS.DESCRIPTION' },
    { titleKey: 'ABOUT.PRIVACY.SECURITY.TITLE', contentKey: 'ABOUT.PRIVACY.SECURITY.DESCRIPTION' },
    { titleKey: 'ABOUT.PRIVACY.USER_RIGHTS.TITLE', contentKey: 'ABOUT.PRIVACY.USER_RIGHTS.DESCRIPTION' },
  ];

  readonly termsItems: AccordionEntry[] = [
    { titleKey: 'ABOUT.TERMS.USAGE.TITLE', contentKey: 'ABOUT.TERMS.USAGE.DESCRIPTION' },
    { titleKey: 'ABOUT.TERMS.RESPONSIBILITIES.TITLE', contentKey: 'ABOUT.TERMS.RESPONSIBILITIES.DESCRIPTION' },
    { titleKey: 'ABOUT.TERMS.PAYMENTS.TITLE', contentKey: 'ABOUT.TERMS.PAYMENTS.DESCRIPTION' },
    { titleKey: 'ABOUT.TERMS.REFUNDS.TITLE', contentKey: 'ABOUT.TERMS.REFUNDS.DESCRIPTION' },
    { titleKey: 'ABOUT.TERMS.SECURITY.TITLE', contentKey: 'ABOUT.TERMS.SECURITY.DESCRIPTION' },
    { titleKey: 'ABOUT.TERMS.LEGAL.TITLE', contentKey: 'ABOUT.TERMS.LEGAL.DESCRIPTION' },
  ];

  readonly activePrivacyIndex = signal<number | null>(null);
  readonly activeTermsIndex = signal<number | null>(null);

  private animatingCounters = false;

  onMouseMove(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    const host = this.el.nativeElement as HTMLElement;
    host.style.setProperty('--mouse-x', `${x}%`);
    host.style.setProperty('--mouse-y', `${y}%`);
  }

  togglePrivacy(index: number): void {
    this.activePrivacyIndex.update((prev) => (prev === index ? null : index));
  }

  toggleTerms(index: number): void {
    this.activeTermsIndex.update((prev) => (prev === index ? null : index));
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      this.initScrollReveal();
      this.initCounterObserver();
      this.initHeroAnimation();
    }, 120);
  }

  private initScrollReveal(): void {
    const items = this.el.nativeElement.querySelectorAll('.scroll-reveal');
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.05 }
    );

    items.forEach((item: HTMLElement) => observer.observe(item));
  }

  private initCounterObserver(): void {
    const section = this.el.nativeElement.querySelector('.stats-section');
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.animatingCounters) {
            this.animatingCounters = true;
            this.animateAllCounters();
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -20% 0px', threshold: 0.25 }
    );

    observer.observe(section);
  }

  private initHeroAnimation(): void {
    const heroContent = this.el.nativeElement.querySelector('.hero-content');
    if (heroContent) {
      this.renderer.addClass(heroContent, 'hero-visible');
    }
  }

  private animateAllCounters(): void {
    const els = this.el.nativeElement.querySelectorAll('.stat-number');
    els.forEach((el: HTMLElement) => {
      const raw = el.getAttribute('data-target');
      if (!raw) return;
      const target = parseInt(raw, 10);
      if (isNaN(target)) return;
      this.animateSingleCounter(el, target);
    });
  }

  private animateSingleCounter(el: HTMLElement, target: number): void {
    const duration = 2200;
    const startTime = performance.now();
    const format = target >= 1000;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      el.textContent = format ? current.toLocaleString() : String(current);
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = format ? target.toLocaleString() : String(target);
      }
    };

    requestAnimationFrame(tick);
  }
}
