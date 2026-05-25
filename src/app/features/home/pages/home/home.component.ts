import { Component } from '@angular/core';
import { HeroComponent } from '../../components/hero/hero.component';
import { CategoryStripComponent } from '../../components/category-strip/category-strip.component';
import { FeaturedProductsComponent } from '../../../products/components/featured-products/featured-products.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeroComponent, CategoryStripComponent, FeaturedProductsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class Home { }
