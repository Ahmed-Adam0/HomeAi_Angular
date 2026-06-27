import { Directive, inject, Signal } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { Theme } from '../../core/constants/theme.constants';

@Directive({
  selector: '[appTheme]',
  standalone: true,
  exportAs: 'appTheme'
})
export class ThemeDirective {
  private readonly themeService = inject(ThemeService);

  // Expose the current theme Signal
  readonly theme: Signal<Theme> = this.themeService.currentThemeSignal;

  // Expose isDark Signal helper
  readonly isDark: Signal<boolean> = this.themeService.isDarkSignal;
}
