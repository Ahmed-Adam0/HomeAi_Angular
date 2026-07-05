import { Component, inject, OnInit, OnDestroy, signal, Input } from '@angular/core';
import { Router, RouterModule, NavigationEnd, Event } from '@angular/router';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { MobileScrollService } from '../../services/mobile-scroll.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface BottomTab {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-mobile-bottom-navigation',
  standalone: true,
  imports: [RouterModule, NgClass, NgFor, NgIf],
  template: `
    <nav class="bottom-nav" *ngIf="!isKeyboardOpen()" role="navigation" aria-label="Bottom Navigation">
      <div class="nav-items" role="tablist">
        <div 
          *ngFor="let tab of tabs" 
          class="nav-item" 
          role="tab"
          [attr.aria-selected]="activeRoute() === tab.route"
          [attr.aria-label]="tab.label"
          [class.active]="activeRoute() === tab.route"
          (click)="handleTabClick(tab.route)">
          <div class="icon-container">
            <i [class]="'pi ' + tab.icon" aria-hidden="true"></i>
          </div>
          <span class="nav-label">{{ tab.label }}</span>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: var(--surface-card, #ffffff);
      border-top: 1px solid var(--surface-border, #e5e7eb);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      z-index: 1000;
      box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.04);
    }
    .nav-items {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 80px; /* MD3 standard height */
      padding: 0 8px;
    }
    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      height: 100%;
      color: var(--text-color-secondary, #49454F);
      cursor: pointer;
      position: relative;
      -webkit-tap-highlight-color: transparent;
    }
    .icon-container {
      width: 64px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px; /* Pill shape for active state */
      margin-bottom: 4px;
      transition: background-color 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
    .nav-item.active .icon-container {
      background-color: var(--primary-color-light, rgba(16, 185, 129, 0.12));
    }
    .nav-item i {
      font-size: 1.5rem;
      transition: color 0.2s, transform 0.2s cubic-bezier(0.2, 0, 0, 1);
    }
    .nav-item.active i {
      color: var(--primary-color, #10b981);
      transform: scale(1.1);
    }
    .nav-label {
      font-size: 0.75rem;
      font-weight: 600;
      transition: color 0.2s, font-weight 0.2s;
    }
    .nav-item.active .nav-label {
      color: var(--primary-color, #10b981);
      font-weight: 700;
    }
  `]
})
export class MobileBottomNavigationComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly mobileScroll = inject(MobileScrollService);
  
  readonly isKeyboardOpen = signal(false);
  readonly activeRoute = signal<string>('/');
  private initialViewportHeight = 0;
  private routerSub?: Subscription;

  @Input() tabs: BottomTab[] = [
    { icon: 'pi-home', label: 'Home', route: '/' },
    { icon: 'pi-shop', label: 'Marketplace', route: '/products' },
    { icon: 'pi-sparkles', label: 'AI', route: '/room-upload' },
    { icon: 'pi-shopping-cart', label: 'Cart', route: '/cart' },
    { icon: 'pi-user', label: 'Profile', route: '/profile' }
  ];

  private resizeHandler = () => this.checkKeyboard();

  ngOnInit() {
    this.updateActiveRoute(this.router.url);

    this.routerSub = this.router.events
      .pipe(filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveRoute(event.urlAfterRedirects);
      });

    if (typeof window !== 'undefined') {
      if (window.visualViewport) {
        this.initialViewportHeight = window.visualViewport.height;
        window.visualViewport.addEventListener('resize', this.resizeHandler);
      } else {
        this.initialViewportHeight = window.innerHeight;
        window.addEventListener('resize', this.resizeHandler);
      }
    }
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    if (typeof window !== 'undefined') {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', this.resizeHandler);
      } else {
        window.removeEventListener('resize', this.resizeHandler);
      }
    }
  }

  private checkKeyboard() {
    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    this.isKeyboardOpen.set(currentHeight < this.initialViewportHeight - 150);
  }

  private updateActiveRoute(url: string) {
    const urlWithoutQuery = url.split('?')[0];
    
    // Exact match for home, otherwise prefix match
    const matchingTab = this.tabs.find(tab => {
      if (tab.route === '/') {
        return urlWithoutQuery === '/';
      }
      return urlWithoutQuery.startsWith(tab.route);
    });

    if (matchingTab) {
      this.activeRoute.set(matchingTab.route);
    }
  }

  handleTabClick(route: string) {
    if (this.activeRoute() === route) {
      this.mobileScroll.scrollToTop();
    } else {
      this.router.navigateByUrl(route);
    }
  }
}
