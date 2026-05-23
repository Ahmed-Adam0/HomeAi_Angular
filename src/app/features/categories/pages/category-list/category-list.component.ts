import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ICategory } from '../../interfaces/icategory';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-category-list-page',
  imports: [RouterLink],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  
  readonly categories = signal<ICategory[]>([]);

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((data) => {
      this.categories.set(data);
    });
  }
}
