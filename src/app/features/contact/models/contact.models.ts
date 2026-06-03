export interface ContactInfo {
  titleKey: string;
  descKey: string;
  icon: string;
  href?: string;
}

export interface SupportOption {
  titleKey: string;
  descKey: string;
  icon: string;
  ctaKey: string;
  ctaLink: string;
}

export interface FAQItem {
  questionKey: string;
  answerKey: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}
