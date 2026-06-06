import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  readonly translationService = inject(TranslationService);
  private tl!: gsap.core.Timeline;

  ngAfterViewInit(): void {
    gsap.registerPlugin(ScrollTrigger);

    this.tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.hero-cinematic__track',
        pin: '.hero-cinematic__pinned',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.8,
        invalidateOnRefresh: true,
      },
      defaults: { ease: 'power1.inOut' }
    });

    this.buildScene1();
    this.buildScene2();
    this.buildScene3();
    this.buildScene4();
    this.buildScene5();
  }

  ngOnDestroy(): void {
    this.tl?.kill();
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private buildScene1(): void {
    this.tl
      .fromTo('.hero-cinematic__headline', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8 }, 0)
      .to('.hero-cinematic__headline', { opacity: 0, y: -80, duration: 1.5 }, 1.5);
  }

  private buildScene2(): void {
    this.tl
      .to('.room-before', { scale: 1.18, duration: 4 }, 0.8)
      .to('.hero-cinematic__scanline', { opacity: 0.6, scaleY: 1.2, duration: 1.2 }, 2.2)
      .to('.hero-cinematic__dots .detect-dot', { opacity: 1, duration: 0.15, stagger: 0.25 }, 2.6)
      .to('.hero-cinematic__scan-status', { opacity: 1, y: 0, duration: 0.8 }, 2.8);
  }

  private buildScene3(): void {
    this.tl
      .to('.hero-cinematic__scan-status', { opacity: 0, y: -10, duration: 0.4 }, 4.8)
      .to('.hero-cinematic__scanline', { opacity: 0, duration: 0.4 }, 4.8)
      .to('.hero-cinematic__dots', { opacity: 0, duration: 0.4 }, 4.8)
      .to('.hero-cinematic__products .product-card', { opacity: 1, y: 0, duration: 0.6, stagger: 0.25 }, 5.2)
      .to('.room-before', { scale: 1.22, duration: 2 }, 5.2);
  }

  private buildScene4(): void {
    this.tl
      .to('.hero-cinematic__products', { opacity: 0, y: 20, duration: 0.6 }, 7.5)
      .to('.room-before', { opacity: 0, duration: 0.8 }, 8)
      .to('.room-after', { opacity: 1, duration: 0.8 }, 8)
      .to('.ba-label--before', { opacity: 1, duration: 0.4 }, 8.2)
      .to('.ba-label--after', { opacity: 1, duration: 0.4 }, 8.4);
  }

  private buildScene5(): void {
    this.tl
      .to('.room-after', { opacity: 0, duration: 0.8 }, 9.5)
      .to('.ba-label', { opacity: 0, duration: 0.4 }, 9.5)
      .to('.hero-cinematic__final', { opacity: 1, duration: 1 }, 9.8)
      .to('.hero-cinematic__overlay', { opacity: 0, duration: 0.5 }, 9.5);
  }

  translate(key: string, fallbackEn: string, fallbackAr: string): string {
    const val = this.translationService.translate(key);
    if (val === key) {
      return this.translationService.currentLang() === 'ar' ? fallbackAr : fallbackEn;
    }
    return val;
  }
}
