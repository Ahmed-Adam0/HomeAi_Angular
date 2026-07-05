import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

@Injectable()
export class TabRouteReuseStrategy implements RouteReuseStrategy {
  private static handlers: { [key: string]: DetachedRouteHandle } = {};

  private readonly tabPaths = [
    '/', '/products', '/ai/rooms', '/cart', '/profile', // Customer tabs
    '/vendor/dashboard', '/vendor/products', '/vendor/orders' // Vendor tabs
  ];

  static clearCache(): void {
    TabRouteReuseStrategy.handlers = {};
  }

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    // Prevent caching parent layout components which causes infinite recursion
    if (route.firstChild) return false;
    
    const path = this.getFullPath(route);
    return this.tabPaths.includes(path);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle): void {
    if (!Capacitor.isNativePlatform()) return;
    const path = this.getFullPath(route);
    if (this.tabPaths.includes(path)) {
      TabRouteReuseStrategy.handlers[path] = handle;
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    if (!Capacitor.isNativePlatform()) return false;
    // Only attach to leaf routes to prevent cyclic component graphs
    if (route.firstChild) return false;
    
    const path = this.getFullPath(route);
    return !!route.routeConfig && !!TabRouteReuseStrategy.handlers[path];
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!Capacitor.isNativePlatform() || !route.routeConfig) return null;
    const path = this.getFullPath(route);
    return TabRouteReuseStrategy.handlers[path] || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }

  private getFullPath(route: ActivatedRouteSnapshot): string {
    const segments = route.pathFromRoot
      .map(v => v.url.map(segment => segment.path).join('/'))
      .filter(path => path !== '');
      
    return segments.length === 0 ? '/' : '/' + segments.join('/');
  }
}
