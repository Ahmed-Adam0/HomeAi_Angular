import { Injectable, inject } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({ providedIn: 'root' })
export class RouteTitleService {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  private readonly titleFallbackMap: Record<string, string> = {
    '/': 'Home',
    '/products': 'Marketplace',
    '/ai/rooms': 'AI Designer',
    '/ai/room-upload': 'AI Designer',
    '/ai/ai-chat': 'AI Chat'
  };

  readonly currentTitle = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.getRouteTitle(this.activatedRoute.root))
    ),
    { initialValue: 'Home' }
  );

  private getRouteTitle(route: ActivatedRoute): string {
    let currentRoute = route;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    if (currentRoute.snapshot.data['title']) {
      return currentRoute.snapshot.data['title'];
    }

    const url = this.router.url.split('?')[0].split('#')[0];
    
    if (this.titleFallbackMap[url]) {
      return this.titleFallbackMap[url];
    }

    for (const key of Object.keys(this.titleFallbackMap).sort((a, b) => b.length - a.length)) {
      if (key !== '/' && url.startsWith(key)) {
        return this.titleFallbackMap[key];
      }
    }

    const segments = url.split('/').filter(s => s.length > 0);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return 'HomeAI';
  }
}
