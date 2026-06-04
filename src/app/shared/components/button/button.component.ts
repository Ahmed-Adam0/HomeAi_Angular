import { Component, input, computed, output } from '@angular/core';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-button',
  imports: [LoadingSpinner],
  templateUrl: './button.component.html',
  styleUrl: './button.component.css',
})
export class Button {
  // Inputs using Angular 20 Signal Input API
  readonly label = input<string>('');
  readonly variant = input<'primary' | 'secondary' | 'outline' | 'premium' | 'danger'>('primary');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly disabled = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  // Outputs using modern Angular 20 output API
  readonly clicked = output<MouseEvent>();

  // Computed state for dynamic CSS class generation
  readonly buttonClass = computed(() => {
    const baseClass = `btn-base btn-${this.variant()} btn-${this.size()}`;
    return this.isLoading() ? `${baseClass} btn-loading fm-btn-loading` : baseClass;
  });

  // Computed state to merge manual disable flag and active loading state
  readonly isButtonDisabled = computed(() => {
    return this.disabled() || this.isLoading();
  });


  /**
   * Dispatches click events safely.
   * Event emissions are blocked if the button is disabled or in a loading state.
   */
  onClick(event: MouseEvent): void {
    if (!this.isButtonDisabled()) {
      this.clicked.emit(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
