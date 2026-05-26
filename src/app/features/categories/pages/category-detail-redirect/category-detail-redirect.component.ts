import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NAV_ROUTES } from '../../../../core/constants';

@Component({
  selector: 'app-category-detail-redirect',
  standalone: true,
  template: '',
})
export class CategoryDetailRedirectComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    void this.router.navigate([NAV_ROUTES.PRODUCTS], {
      queryParams: id ? { categoryId: id } : {},
      replaceUrl: true,
    });
  }
}
