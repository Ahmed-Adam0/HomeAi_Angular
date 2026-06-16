import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../shared/i18n/translation.service';

interface IShowcaseCategory {
  id: number;
  titleKey: string;
  buttonKey: string;
  imageUrl: string;
  queryParams: Record<string, string>;
}

@Component({
  selector: 'app-interior-categories-showcase',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './interior-categories-showcase.component.html',
  styleUrl: './interior-categories-showcase.component.css'
})
export class InteriorCategoriesShowcaseComponent {
  readonly translationService = inject(TranslationService);

  readonly showcaseCategories: IShowcaseCategory[] = [
    {
      id: 1,
      titleKey: 'HOME.SHOWCASE.BEIGE_TITLE',
      buttonKey: 'HOME.SHOWCASE.BEIGE_BTN',
      imageUrl: '/assets/images/beige_interior.png',
      queryParams: { query: 'beige' }
    },
    {
      id: 2,
      titleKey: 'HOME.SHOWCASE.KITCHEN_TITLE',
      buttonKey: 'HOME.SHOWCASE.KITCHEN_BTN',
      imageUrl: '/assets/images/kitchen_furniture.png',
      queryParams: { query: 'kitchen' }
    }
  ];

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  trackByCategoryId(index: number, category: IShowcaseCategory): number {
    return category.id;
  }
}
