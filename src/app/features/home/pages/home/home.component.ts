import { Component, ElementRef, inject, PLATFORM_ID, Renderer2, AfterViewInit, OnInit } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { HeroSectionComponent } from '../../components/hero-section/hero-section.component';
import { InteriorCategoriesShowcaseComponent } from '../../components/interior-categories-showcase/interior-categories-showcase.component';
import { LatestCollectionsComponent } from '../../components/latest-collections/latest-collections.component';
import { CategoryStripComponent } from '../../components/category-strip/category-strip.component';
import { FeaturedProductsComponent } from '../../../products/components/featured-products/featured-products.component';
import { AiHowItWorksComponent } from '../../components/ai-how-it-works/ai-how-it-works.component';
import { TestimonialsStatsComponent } from '../../components/testimonials-stats/testimonials-stats.component';
import { AiRoomShowcaseComponent } from '../../components/ai-room-showcase/ai-room-showcase.component';
import { WhyChooseUsComponent } from '../../components/why-choose-us/why-choose-us.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroSectionComponent,
    InteriorCategoriesShowcaseComponent,
    LatestCollectionsComponent,
    CategoryStripComponent,
    AiHowItWorksComponent,
    AiRoomShowcaseComponent,
    FeaturedProductsComponent,
    TestimonialsStatsComponent,
    WhyChooseUsComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class Home implements AfterViewInit, OnInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const currentUrl = window.location.href;
      
      // Check if URL has query params before hash (Paymob redirect format)
      if (currentUrl.includes('?') && currentUrl.includes('#') && currentUrl.indexOf('?') < currentUrl.indexOf('#')) {
        const rest = currentUrl.split('?')[1];
        const paramsStr = rest.split('#')[0];
        const route = rest.split('#')[1] || '/';
        
        // Extract query params
        const params = new URLSearchParams(paramsStr);
        const queryParams: any = {};
        params.forEach((value, key) => {
          queryParams[key] = value;
        });

        // Use Angular Router to navigate to the intended route with extracted params
        this.router.navigate([route], { queryParams, replaceUrl: true });
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Small timeout ensures the browser completes layout calculations before observation starts,
      // preventing a race condition where elements are observed at (0, 0) height and trigger instantly.
      setTimeout(() => {
        const sections = this.el.nativeElement.querySelectorAll(
          'app-interior-categories-showcase, app-latest-collections, app-category-strip, app-ai-how-it-works, app-ai-room-showcase, app-featured-products, app-testimonials-stats, app-why-choose-us'
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


