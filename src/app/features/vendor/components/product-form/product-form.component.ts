import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IProduct } from '../../../products/interfaces/iproduct';
import { ICategory } from '../../../../features/categories/interfaces/icategory';
import { CategoryService } from '../../../../features/categories/services/category.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductForm implements OnInit, OnChanges {
  @Input() initialData: Partial<IProduct> | null = null;
  @Input() isSubmitting = false;
  
  @Output() formSubmit = new EventEmitter<Partial<IProduct>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  readonly translationService = inject(TranslationService);

  readonly categories = signal<ICategory[]>([]);
  productForm!: FormGroup;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData && this.productForm) {
      this.productForm.patchValue({
        nameAr: this.initialData.nameAr || '',
        nameEn: this.initialData.nameEn || '',
        descriptionAr: this.initialData.descriptionAr || '',
        descriptionEn: this.initialData.descriptionEn || '',
        price: this.initialData.price || '',
        categoryId: this.initialData.categoryId || '',
        isActive: this.initialData.isActive ?? true
      });
    }
  }

  private initForm(): void {
    this.productForm = this.fb.group({
      nameAr: ['', [Validators.required, Validators.minLength(3)]],
      nameEn: ['', [Validators.required, Validators.minLength(3)]],
      descriptionAr: ['', [Validators.required, Validators.minLength(5)]],
      descriptionEn: ['', [Validators.required, Validators.minLength(5)]],
      price: ['', [Validators.required, Validators.min(1)]],
      categoryId: ['', [Validators.required]],
      isActive: [true]
    });
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        this.categories.set(cats || []);
      },
      error: (err) => {
        console.error('Failed to load categories', err);
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.value;
    const submissionData: Partial<IProduct> = {
      ...formValue,
      price: Number(formValue.price),
      categoryId: Number(formValue.categoryId)
    };

    this.formSubmit.emit(submissionData);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  isInvalid(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
