import { Component, Input, Output, EventEmitter, inject, signal, computed, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-hotspot-item',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hotspot-item.component.html',
  styleUrl: './hotspot-item.component.css'
})
export class HotspotItemComponent {
  readonly translationService = inject(TranslationService);
  private elementRef = inject(ElementRef);

  @Input({ required: true }) hotspot!: ShowcaseHotspot;
  @Input({ required: true }) index!: number;
  @Input({ required: true }) productsList: { value: number; label: string }[] = [];

  @Output() delete = new EventEmitter<number>();
  @Output() update = new EventEmitter<{ index: number; changes: Partial<ShowcaseHotspot> }>();

  readonly isDropdownOpen = signal<boolean>(false);
  readonly searchText = signal<string>('');

  readonly filteredProducts = computed(() => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return this.productsList;
    return this.productsList.filter(prod => prod.label.toLowerCase().includes(query));
  });

  readonly selectedProductLabel = computed(() => {
    const matched = this.productsList.find(p => p.value === this.hotspot.productId);
    return matched ? matched.label : '';
  });

  toggleDropdown(): void {
    this.isDropdownOpen.update(o => !o);
    if (this.isDropdownOpen()) {
      this.searchText.set('');
    }
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchText.set(val);
  }

  selectProduct(productId: number): void {
    this.update.emit({
      index: this.index,
      changes: { productId }
    });
    this.isDropdownOpen.set(false);
  }

  onOrderChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10) || 0;
    this.update.emit({
      index: this.index,
      changes: { displayOrder: val }
    });
  }

  onActiveChange(event: Event): void {
    const val = (event.target as HTMLInputElement).checked;
    this.update.emit({
      index: this.index,
      changes: { isActive: val }
    });
  }

  onDelete(): void {
    this.delete.emit(this.index);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }
}
