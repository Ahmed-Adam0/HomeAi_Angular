import { Component, ElementRef, inject, PLATFORM_ID, Renderer2, AfterViewInit } from '@angular/core';
import { isPlatformBrowser, NgFor } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface IFeatureCard {
  id: number;
  numberStr: string;
  image: string;
  titleKey: string;
  descKey: string;
}

@Component({
  selector: 'app-why-choose-us',
  standalone: true,
  imports: [NgFor, TranslatePipe],
  templateUrl: './why-choose-us.component.html',
  styleUrl: './why-choose-us.component.css'
})
export class WhyChooseUsComponent implements AfterViewInit {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private platformId = inject(PLATFORM_ID);

  readonly features: IFeatureCard[] = [
    {
      id: 1,
      numberStr: '1',
      image: 'assets/images/why-choose-us/craftsmanship.png',
      titleKey: 'WHY_CHOOSE_US.CRAFTSMANSHIP_TITLE',
      descKey: 'WHY_CHOOSE_US.CRAFTSMANSHIP_DESC'
    },
    {
      id: 2,
      numberStr: '2',
      image: 'assets/images/why-choose-us/materials.png',
      titleKey: 'WHY_CHOOSE_US.MATERIALS_TITLE',
      descKey: 'WHY_CHOOSE_US.MATERIALS_DESC'
    },
    {
      id: 3,
      numberStr: '3',
      image: 'assets/images/why-choose-us/details.png',
      titleKey: 'WHY_CHOOSE_US.DETAILS_TITLE',
      descKey: 'WHY_CHOOSE_US.DETAILS_DESC'
    }
  ];

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Small delay to ensure browser layout is stable
      setTimeout(() => {
        const cards = this.el.nativeElement.querySelectorAll('.why-choose-card');
        const observerOptions = {
          root: null,
          rootMargin: '0px 0px -10% 0px',
          threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              this.renderer.addClass(entry.target, 'reveal-visible');
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);

        cards.forEach((card: HTMLElement) => {
          this.renderer.addClass(card, 'scroll-reveal-card');
          observer.observe(card);
        });
      }, 100);
    }
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/image-placeholder.svg';
    }
  }
}
