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
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { ContactService } from '../../services/contact.service';
import type { ContactInfo, SupportOption, FAQItem } from '../../models/contact.models';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, TranslatePipe],
  templateUrl: './contact-page.component.html',
  styleUrl: './contact-page.component.css',
})
export class ContactPageComponent implements AfterViewInit {
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);
  readonly translationService = inject(TranslationService);

  readonly contactInfo: ContactInfo[] = [
    { titleKey: 'CONTACT.INFO.PHONE.TITLE', descKey: 'CONTACT.INFO.PHONE.DESCRIPTION', icon: 'bi bi-telephone', href: 'tel:01214649915' },
    { titleKey: 'CONTACT.INFO.EMAIL.TITLE', descKey: 'CONTACT.INFO.EMAIL.DESCRIPTION', icon: 'bi bi-envelope', href: 'mailto:support@furnimind.ai' },
    { titleKey: 'CONTACT.INFO.LOCATION.TITLE', descKey: 'CONTACT.INFO.LOCATION.DESCRIPTION', icon: 'bi bi-geo-alt' },
    { titleKey: 'CONTACT.INFO.HOURS.TITLE', descKey: 'CONTACT.INFO.HOURS.DESCRIPTION', icon: 'bi bi-clock' },
  ];

  readonly supportOptions: SupportOption[] = [
    { titleKey: 'CONTACT.SUPPORT.CUSTOMER.TITLE', descKey: 'CONTACT.SUPPORT.CUSTOMER.DESC', icon: 'bi bi-headset', ctaKey: 'CONTACT.SUPPORT.CUSTOMER.CTA', ctaLink: 'mailto:support@furnimind.ai' },
    { titleKey: 'CONTACT.SUPPORT.TECHNICAL.TITLE', descKey: 'CONTACT.SUPPORT.TECHNICAL.DESC', icon: 'bi bi-gear', ctaKey: 'CONTACT.SUPPORT.TECHNICAL.CTA', ctaLink: 'mailto:tech@furnimind.ai' },
    { titleKey: 'CONTACT.SUPPORT.SALES.TITLE', descKey: 'CONTACT.SUPPORT.SALES.DESC', icon: 'bi bi-graph-up-arrow', ctaKey: 'CONTACT.SUPPORT.SALES.CTA', ctaLink: 'mailto:sales@furnimind.ai' },
    { titleKey: 'CONTACT.SUPPORT.VENDOR.TITLE', descKey: 'CONTACT.SUPPORT.VENDOR.DESC', icon: 'bi bi-shop', ctaKey: 'CONTACT.SUPPORT.VENDOR.CTA', ctaLink: 'mailto:vendor@furnimind.ai' },
  ];

  readonly faqItems: FAQItem[] = [
    { questionKey: 'CONTACT.FAQ.Q1', answerKey: 'CONTACT.FAQ.A1' },
    { questionKey: 'CONTACT.FAQ.Q2', answerKey: 'CONTACT.FAQ.A2' },
    { questionKey: 'CONTACT.FAQ.Q3', answerKey: 'CONTACT.FAQ.A3' },
    { questionKey: 'CONTACT.FAQ.Q4', answerKey: 'CONTACT.FAQ.A4' },
  ];

  readonly contactForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[\d\s\-\+\(\)]{7,20}$/)]],
    subject: ['', [Validators.required, Validators.minLength(5)]],
    message: ['', [Validators.required, Validators.minLength(10)]],
  });

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly submitSuccess = signal(false);
  readonly submitError = signal(false);
  readonly activeFaqIndex = signal<number | null>(null);

  get f() {
    return this.contactForm.controls;
  }

  toggleFaq(index: number): void {
    this.activeFaqIndex.update((prev) => (prev === index ? null : index));
  }

  onSubmit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.submitSuccess.set(false);
    this.submitError.set(false);
    this.submitted.set(false);

    const formData = {
      name: this.f.name.value ?? '',
      email: this.f.email.value ?? '',
      phone: this.f.phone.value ?? '',
      subject: this.f.subject.value ?? '',
      message: this.f.message.value ?? '',
    };

    this.contactService.submitInquiry(formData).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.set(true);
        if (res.success) {
          this.submitSuccess.set(true);
          this.contactForm.reset();
        } else {
          this.submitError.set(true);
        }
      },
      error: () => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.submitError.set(true);
      },
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      this.initScrollReveal();
      this.initHeroAnimation();
    }, 100);
  }

  private initScrollReveal(): void {
    const items = this.el.nativeElement.querySelectorAll('.scroll-reveal');
    if (!items.length) return;

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

  private initHeroAnimation(): void {
    const hero = this.el.nativeElement.querySelector('.hero-content');
    if (hero) {
      this.renderer.addClass(hero, 'hero-visible');
    }
  }
}
