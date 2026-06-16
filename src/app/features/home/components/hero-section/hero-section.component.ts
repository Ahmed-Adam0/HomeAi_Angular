import { Component, inject, OnInit, OnDestroy, signal, PLATFORM_ID, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../categories/interfaces/icategory';
import { HeroSlide } from './hero-section.model';
import { gsap } from 'gsap';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.css'
})
export class HeroSectionComponent implements OnInit, OnDestroy {
  readonly translationService = inject(TranslationService);
  private readonly categoryService = inject(CategoryService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly el = inject(ElementRef);

  // Dynamic Categories from API/Database
  readonly categories = signal<ICategory[]>([]);

  // 5 Vertical columns for split curtain / door transition
  readonly slices = Array.from({ length: 5 }, (_, i) => {
    const col = i;
    const right = 100 - (col + 1) * 20;
    const left = col * 20;
    
    // Start clip path is the fully visible vertical stripe
    const startClip = `inset(0% ${right}% 0% ${left}%)`;
      
    // End clip path alternates: even columns open left, odd columns open right
    const endClip = col % 2 === 0
      ? `inset(0% ${right + 20}% 0% ${left}%)`
      : `inset(0% ${right}% 0% ${left + 20}%)`;

    return {
      index: i,
      startClip,
      endClip,
      leftOffset: `${left}%`,
      widthOffset: '20%'
    };
  });

  // Simple clean slide data matching reference
  readonly slides: HeroSlide[] = [
    {
      id: 1,
      image: '/assets/images/hero_interior.png',
      titleKey: 'HOME.HERO.SLIDE_1.TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_1.DESCRIPTION',
      buttonKey: 'HOME.HERO.SLIDE_1.BUTTON'
    },
    {
      id: 2,
      image: '/assets/images/room_living.png',
      titleKey: 'HOME.HERO.SLIDE_2.TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_2.DESCRIPTION',
      buttonKey: 'HOME.HERO.SLIDE_2.BUTTON'
    },
    {
      id: 3,
      image: '/assets/images/room_bedroom.png',
      titleKey: 'HOME.HERO.SLIDE_3.TITLE',
      descriptionKey: 'HOME.HERO.SLIDE_3.DESCRIPTION',
      buttonKey: 'HOME.HERO.SLIDE_3.BUTTON'
    }
  ];

  // Active state signals
  readonly currentSlideIndex = signal<number>(0);
  readonly previousSlideIndex = signal<number>(0);
  readonly isTransitioning = signal<boolean>(false);

  private autoplayIntervalId: any = null;

  ngOnInit(): void {
    this.loadCategories();
    this.startAutoplay();
    
    // Initial entrance animation on load
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.playTransition(-1, 0);
      }, 300);
    }
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        // Map local fallback images if needed (similar to landing strip fallbacks)
        const processed = data.map((cat, idx) => {
          return {
            ...cat,
            imageUrl: cat.imageUrl || this.getFallbackImage(cat.id || idx + 1)
          };
        });
        // Limit to 8 categories as seen in the reference screenshot
        this.categories.set(processed.slice(0, 8));
      },
      error: (err) => {
        console.error('Failed to load categories for landing hero', err);
      }
    });
  }

  getFallbackImage(id: number): string {
    const fallbacks: Record<number, string> = {
      1: '/assets/images/room_living.png',  // Sofas
      2: '/assets/images/room_bedroom.png', // Wardrobes
      3: '/assets/images/room_dining.png',  // Chairs
      4: '/assets/images/room_office.png',  // Desks
      5: '/assets/images/room_outdoor.png', // Tables
      6: '/assets/images/room_kids.png'     // Lighting
    };
    return fallbacks[id] || '/assets/images/room_living.png';
  }

  startAutoplay(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopAutoplay();
      this.autoplayIntervalId = setInterval(() => {
        this.nextSlide();
      }, 6000);
    }
  }

  stopAutoplay(): void {
    if (this.autoplayIntervalId) {
      clearInterval(this.autoplayIntervalId);
      this.autoplayIntervalId = null;
    }
  }

  selectSlide(index: number): void {
    if (index === this.currentSlideIndex() || this.isTransitioning()) return;

    const prevIdx = this.currentSlideIndex();
    this.previousSlideIndex.set(prevIdx);
    this.currentSlideIndex.set(index);
    this.isTransitioning.set(true);

    // Reset autoplay timer
    this.startAutoplay();

    this.playTransition(prevIdx, index);
  }

  nextSlide(): void {
    const nextIndex = (this.currentSlideIndex() + 1) % this.slides.length;
    this.selectSlide(nextIndex);
  }

  prevSlide(): void {
    const prevIndex = (this.currentSlideIndex() - 1 + this.slides.length) % this.slides.length;
    this.selectSlide(prevIndex);
  }

  playTransition(prevIdx: number, newIdx: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.isTransitioning.set(false);
      return;
    }

    setTimeout(() => {
      const container = this.el.nativeElement;
      const slices = container.querySelectorAll('.slice-panel');
      const prevText = container.querySelectorAll('.hero-slide.previous .word-content, .hero-slide.previous .hero-description, .hero-slide.previous .hero-cta-btn, .hero-slide.previous .hero-subtitle');
      const newImage = container.querySelector('.hero-slide.active .slide-image');
      const newSubtitle = container.querySelector('.hero-slide.active .hero-subtitle');
      const newWords = container.querySelectorAll('.hero-slide.active .word-content');
      const newDesc = container.querySelector('.hero-slide.active .hero-description');
      const newBtn = container.querySelector('.hero-slide.active .hero-cta-btn');
      const darkOverlay = container.querySelector('.transition-dark-overlay');

      const tl = gsap.timeline({
        onComplete: () => {
          this.isTransitioning.set(false);
          this.startAutoplay();
        }
      });

      // 1. Outgoing slide text exits: slide upward behind mask
      if (prevIdx !== -1) {
        if (prevText.length > 0) {
          tl.to(prevText, {
            y: -50,
            opacity: 0,
            duration: 0.6,
            ease: 'power4.in',
            stagger: 0.015
          }, 0);
        }
      }

      // 2. Outgoing slide vertical curtain door reveal (staggered shrink)
      if (slices.length > 0) {
        slices.forEach((slice: any) => {
          const idx = parseInt(slice.getAttribute('data-slice-index') || '0', 10);
          const sliceConfig = this.slices[idx];

          tl.fromTo(slice, {
            clipPath: sliceConfig.startClip,
            opacity: 1
          }, {
            clipPath: sliceConfig.endClip,
            opacity: 0.9,
            duration: 1.5,
            ease: 'power4.inOut'
          }, 0.05 + idx * 0.08); // Staggered wipe-open
        });
      }

      // Fade out transition overlay blur and dark cover
      if (darkOverlay) {
        tl.fromTo(darkOverlay, {
          opacity: 1
        }, {
          opacity: 0,
          duration: 1.5,
          ease: 'power3.inOut'
        }, 0.1);
      }

      // 3. Continuous slow Ken Burns zoom-in on the active incoming image (from 1.03 to 1.08)
      if (newImage) {
        gsap.killTweensOf(newImage);
        
        gsap.fromTo(newImage, {
          scale: 1.03
        }, {
          scale: 1.08,
          duration: 10,
          ease: 'sine.out',
          delay: prevIdx !== -1 ? 0.1 : 0,
          overwrite: 'auto'
        });
      }

      // 4. New text reveal (letters/lines entering upward from bottom with soft fade)
      const textStartPos = prevIdx !== -1 ? 0.8 : 0.2;

      if (newSubtitle) {
        tl.fromTo(newSubtitle, {
          y: 25,
          opacity: 0
        }, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power4.out'
        }, textStartPos);
      }

      if (newWords && newWords.length > 0) {
        tl.fromTo(newWords, {
          y: 60,
          opacity: 0
        }, {
          y: 0,
          opacity: 1,
          duration: 1.0,
          ease: 'power4.out',
          stagger: 0.035
        }, textStartPos + 0.08);
      }

      if (newDesc) {
        tl.fromTo(newDesc, {
          y: 25,
          opacity: 0
        }, {
          y: 0,
          opacity: 0.75,
          duration: 0.9,
          ease: 'power3.out'
        }, textStartPos + 0.25);
      }

      if (newBtn) {
        tl.fromTo(newBtn, {
          y: 20,
          opacity: 0
        }, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'power3.out'
        }, textStartPos + 0.35);
      }
    }, 0);
  }

  getWords(text: string): string[] {
    if (!text) return [];
    return text.split(' ');
  }

  onMouseMove(event: MouseEvent): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const container = this.el.nativeElement;
    const images = container.querySelectorAll('.slide-image, .slice-image-el');
    if (!images.length) return;

    const { clientX, clientY } = event;
    const { innerWidth, innerHeight } = window;
    
    // Normalize coordinates from -0.5 to 0.5
    const xNormal = (clientX / innerWidth) - 0.5;
    const yNormal = (clientY / innerHeight) - 0.5;

    // Shift images gently for parallax depth
    gsap.to(images, {
      x: xNormal * 25,
      y: yNormal * 25,
      duration: 1.5,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  }

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  trackBySlideId(index: number, slide: HeroSlide): number {
    return slide.id;
  }

  trackByCategoryId(index: number, category: ICategory): number {
    return category.id;
  }
}
