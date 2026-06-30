import {
  Component, Input, Output, EventEmitter, inject, signal, computed,
  ElementRef, ViewChild, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Overlay, OverlayRef, OverlayModule,
  FlexibleConnectedPositionStrategy,
  ConnectedPosition
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TemplateRef, ViewContainerRef } from '@angular/core';
import { ShowcaseHotspot } from '../../interfaces/showcase-hotspot.interface';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-hotspot-item',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  templateUrl: './hotspot-item.component.html',
  styleUrl: './hotspot-item.component.css'
})
export class HotspotItemComponent implements OnDestroy {
  readonly translationService = inject(TranslationService);
  private elementRef = inject(ElementRef);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  @Input({ required: true }) hotspot!: ShowcaseHotspot;
  @Input({ required: true }) index!: number;
  @Input({ required: true }) productsList: { value: number; label: string }[] = [];

  @Output() delete = new EventEmitter<number>();
  @Output() update = new EventEmitter<{ index: number; changes: Partial<ShowcaseHotspot> }>();

  @ViewChild('dropdownTrigger') dropdownTriggerEl!: ElementRef<HTMLElement>;
  @ViewChild('dropdownPanel') dropdownPanelTpl!: TemplateRef<any>;

  readonly isCollapsed = signal<boolean>(false);
  readonly isDropdownOpen = signal<boolean>(false);
  readonly searchText = signal<string>('');

  private overlayRef: OverlayRef | null = null;

  toggleCollapse(): void {
    this.isCollapsed.update(c => !c);
    // Close dropdown if collapsing
    if (this.isCollapsed()) {
      this.closeDropdown();
    }
  }

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
    if (this.isDropdownOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  private openDropdown(): void {
    if (this.overlayRef) {
      this.closeDropdown();
    }

    this.searchText.set('');

    const triggerEl = this.dropdownTriggerEl.nativeElement;

    const positions: ConnectedPosition[] = [
      // Prefer below
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
      // Fallback: above
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 }
    ];

    const positionStrategy = this.overlay.position()
      .flexibleConnectedTo(triggerEl)
      .withPositions(positions)
      .withPush(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: triggerEl.getBoundingClientRect().width,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => {
      this.closeDropdown();
    });

    // Close on detach
    this.overlayRef.detachments().subscribe(() => {
      this.closeDropdown();
    });

    const portal = new TemplatePortal(this.dropdownPanelTpl, this.viewContainerRef);
    this.overlayRef.attach(portal);

    this.isDropdownOpen.set(true);
  }

  private closeDropdown(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isDropdownOpen.set(false);
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
    this.closeDropdown();
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

  ngOnDestroy(): void {
    this.closeDropdown();
  }
}
