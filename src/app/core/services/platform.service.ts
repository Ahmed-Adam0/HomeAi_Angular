import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly platformId = inject(PLATFORM_ID);
  
  isNative(): boolean {
    const isBrowser = isPlatformBrowser(this.platformId);
    const capNative = Capacitor.isNativePlatform();
    const result = isBrowser && capNative;
    console.log(`[Diagnostic] PlatformService.isNative() called -> isBrowser: ${isBrowser}, Capacitor.getPlatform(): ${Capacitor.getPlatform()}, Capacitor.isNativePlatform(): ${capNative} -> Returning: ${result}`);
    return result;
  }

  isAndroid(): boolean {
    return isPlatformBrowser(this.platformId) && Capacitor.getPlatform() === 'android';
  }

  isIOS(): boolean {
    return isPlatformBrowser(this.platformId) && Capacitor.getPlatform() === 'ios';
  }

  isWeb(): boolean {
    return !isPlatformBrowser(this.platformId) || Capacitor.getPlatform() === 'web' || !this.isNative();
  }

  constructor() {
    console.log(`[Diagnostic] PlatformService initialized. Capacitor.getPlatform(): ${Capacitor.getPlatform()}, Capacitor.isNativePlatform(): ${Capacitor.isNativePlatform()}`);
  }
}
