import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { App } from '@capacitor/app';
import { filter } from 'rxjs/operators';
import { PlatformService } from './platform.service';
import { OverlayStateService } from './overlay-state.service';
import { UiState } from '../state/ui.state';

@Injectable({ providedIn: 'root' })
export class MobileNavigationService {
  private readonly platform = inject(PlatformService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly overlayState = inject(OverlayStateService);
  private readonly uiState = inject(UiState);

  private readonly navigationStack: string[] = [];
  private lastBackPressTime = 0;

  constructor() {
    if (this.platform.isNative()) {
      this.initNavigationTracker();
      this.initBackButtonListener();
    }
  }

  get stackSize(): number {
    return this.navigationStack.length;
  }

  private initNavigationTracker(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects.split('?')[0];
        
        if (this.navigationStack.length === 0 || this.navigationStack[this.navigationStack.length - 1] !== url) {
          this.navigationStack.push(url);
        }
      });
  }

  private initBackButtonListener(): void {
    App.addListener('backButton', () => {
      this.handleHardwareBack();
    });
  }

  handleHardwareBack(): void {
    if (this.overlayState.hasActiveOverlays()) {
      this.overlayState.closeTopmostOverlay();
      return;
    }

    if (this.navigationStack.length > 1) {
      this.navigationStack.pop();
      this.location.back();
      return;
    }

    const currentTime = new Date().getTime();
    if (currentTime - this.lastBackPressTime < 2000) {
      App.exitApp();
    } else {
      this.lastBackPressTime = currentTime;
      this.uiState.showAlert('info', 'Press back again to exit');
    }
  }
}
