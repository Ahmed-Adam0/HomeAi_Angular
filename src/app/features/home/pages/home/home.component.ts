import { Component, ElementRef, inject, PLATFORM_ID, Renderer2, AfterViewInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { CategoryStripComponent } from '../../components/category-strip/category-strip.component';
import { FeaturedProductsComponent } from '../../../products/components/featured-products/featured-products.component';
import { AiHowItWorksComponent } from '../../components/ai-how-it-works/ai-how-it-works.component';
import { TestimonialsStatsComponent } from '../../components/testimonials-stats/testimonials-stats.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    CategoryStripComponent,
    AiHowItWorksComponent,
    FeaturedProductsComponent,
    TestimonialsStatsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class Home implements AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Small timeout ensures the browser completes layout calculations before observation starts,
      // preventing a race condition where elements are observed at (0, 0) height and trigger instantly.
      setTimeout(() => {
        const sections = this.el.nativeElement.querySelectorAll(
          'app-category-strip, app-ai-how-it-works, app-featured-products, app-testimonials-stats'
        );

        const observerOptions = {
          root: null,
          rootMargin: '0px 0px -25% 0px', // Trigger precisely when approximately 25% of viewport scrolls near section
          threshold: 0.05,
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.renderer.addClass(entry.target, 'reveal-visible');
              observer.unobserve(entry.target); // Trigger exactly once
            }
          });
        }, observerOptions);

        sections.forEach((section: HTMLElement) => {
          // Pre-emptively add target class for animation initial state
          this.renderer.addClass(section, 'scroll-reveal-item');
          observer.observe(section);
        });
      }, 80);
    }
  }
}

