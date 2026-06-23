import { Injectable, PLATFORM_ID, inject, signal, DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, asyncScheduler } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class NotificationSoundService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private audio: HTMLAudioElement | null = null;
  private readonly playSubject = new Subject<void>();
  private readonly localStorageKey = 'homeai_notification_sound_muted';
  private unlocked = false;

  readonly isMuted = signal<boolean>(false);

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    try {
      const storedMute = localStorage.getItem(this.localStorageKey);
      if (storedMute !== null) {
        this.isMuted.set(storedMute === 'true');
      }
    } catch (e) {
      console.warn('Failed to read sound settings from localStorage:', e);
    }

    this.initAudio();

    this.playSubject
      .pipe(
        throttleTime(1000, asyncScheduler, { leading: true, trailing: false }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.executePlay();
      });

    this.setupInteractionUnlock();
  }

  playSound(): void {
    if (!this.isBrowser || this.isMuted()) {
      return;
    }
    this.playSubject.next();
  }

  unlockAudio(): void {
    if (!this.isBrowser || !this.audio || this.unlocked) {
      return;
    }
    this.unlocked = true;
    this.audio.play().then(() => {
      this.audio?.pause();
    }).catch(() => {
      // still unsupported
    });
  }

  toggleMute(): void {
    this.setMuted(!this.isMuted());
  }

  setMuted(muted: boolean): void {
    this.isMuted.set(muted);
    if (!this.isBrowser) {
      return;
    }
    try {
      localStorage.setItem(this.localStorageKey, String(muted));
    } catch (e) {
      console.warn('Failed to save sound settings to localStorage:', e);
    }
  }

  private initAudio(): void {
    try {
      this.audio = new Audio('assets/sounds/notification.mp3');
      this.audio.preload = 'auto';
      this.audio.load();
    } catch (e) {
      console.error('Failed to initialize notification audio:', e);
    }
  }

  private executePlay(): void {
    if (!this.audio) {
      return;
    }
    try {
      this.audio.currentTime = 0;
      const playPromise = this.audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          if (error.name === 'NotAllowedError') {
            console.warn(
              'Notification sound playback prevented by browser autoplay policy. ' +
              'User interaction is required before audio can play.',
            );
          } else {
            console.error('Failed to play notification sound:', error);
          }
        });
      }
    } catch (e) {
      console.error('Error playing notification audio:', e);
    }
  }

  private setupInteractionUnlock(): void {
    if (!this.isBrowser) {
      return;
    }

    const unlock = () => {
      this.unlockAudio();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };

    document.addEventListener('click', unlock, { passive: true });
    document.addEventListener('keydown', unlock, { passive: true });
    document.addEventListener('touchstart', unlock, { passive: true });
  }
}
