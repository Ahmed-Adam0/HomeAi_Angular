import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IProduct } from '../../../products/interfaces/iproduct';
import { ICategory } from '../../../../features/categories/interfaces/icategory';
import { CategoryService } from '../../../../features/categories/services/category.service';
import { VendorService } from '../../services/vendor.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LocalizedPipe, AutoDirectionDirective, CurrencyFormatPipe],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductForm implements OnInit, OnChanges {
  @Input() initialData: Partial<IProduct> | null = null;
  @Input() isSubmitting = false;
  @Input() imageCount = 0;
  
  @Output() formSubmit = new EventEmitter<Partial<IProduct>>();
  @Output() cancel = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private vendorService = inject(VendorService);
  readonly translationService = inject(TranslationService);

  readonly categories = signal<ICategory[]>([]);
  readonly subcategories = signal<any[]>([]);
  readonly productTypes = signal<any[]>([]);
  readonly availableMaterials = signal<any[]>([]);
  /** Vendor-entered price per option ID: { optionId -> priceOption } */
  readonly optionPrices = signal<Record<number, number>>({});
  productForm!: FormGroup;

  constructor() {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadVendorMaterials();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialData'] && this.initialData && this.productForm) {
      this.productForm.patchValue({
        nameAr: this.initialData.nameAr || '',
        nameEn: this.initialData.nameEn || '',
        descriptionAr: this.initialData.descriptionAr || '',
        descriptionEn: this.initialData.descriptionEn || '',
        price: this.initialData.price || '',
        isActive: this.initialData.isActive ?? true,
        vendorMaterialOptionIds: this.initialData.vendorMaterialOptionIds || []
      });

      // Pre-populate per-option prices from materialGroups on the product
      const prices: Record<number, number> = {};
      const rawMaterialGroups = (this.initialData as any).materialGroups as any[];
      if (Array.isArray(rawMaterialGroups)) {
        for (const group of rawMaterialGroups) {
          for (const opt of (group.options || [])) {
            prices[opt.id] = opt.priceOption ?? opt.priceDelta ?? 0;
          }
        }
      }
      this.optionPrices.set(prices);
      
      const catId = this.initialData.categoryId;
      const subCatId = (this.initialData as any).subCategoryId || (this.initialData as any).subCategory?.id;
      const pTypeId = (this.initialData as any).productTypeId || (this.initialData as any).productType?.id;

      if (catId && subCatId && pTypeId) {
        // Direct resolution (performance optimized & reliable)
        this.categoryService.getCategories().subscribe((cats) => {
          this.categories.set(cats || []);
        });
        this.categoryService.getSubcategories(Number(catId)).subscribe({
          next: (subs) => {
            this.subcategories.set(subs || []);
            this.categoryService.getProductTypes(Number(subCatId)).subscribe({
              next: (types) => {
                this.productTypes.set(types || []);
                this.productForm.patchValue({
                  categoryId: catId,
                  subCategoryId: subCatId,
                  productTypeId: pTypeId
                });
              },
              error: (err) => console.error('Failed to load product types in edit', err)
            });
          },
          error: (err) => console.error('Failed to load subcategories in edit', err)
        });
      } else if (pTypeId) {
        // Fallback hierarchy resolver
        this.resolveHierarchy(Number(pTypeId));
      }
    }
    if (changes['imageCount'] && this.productForm) {
      const imagesControl = this.productForm.get('images');
      if (imagesControl) {
        imagesControl.setValue(this.imageCount > 0 ? 'valid' : '');
      }
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
      subCategoryId: ['', [Validators.required]],
      productTypeId: ['', [Validators.required]],
      isActive: [true],
      images: ['', [Validators.required]],
      vendorMaterialOptionIds: [[]]
    });
  }

  private loadVendorMaterials(): void {
    this.vendorService.getVendorMaterials().subscribe({
      next: (mats) => {
        this.availableMaterials.set(mats || []);
      },
      error: (err) => {
        console.error('Failed to load vendor materials', err);
      }
    });
  }

  toggleOption(optionId: number, defaultPrice: number = 0): void {
    const control = this.productForm.get('vendorMaterialOptionIds');
    if (!control) return;
    const current = (control.value || []) as number[];
    if (current.includes(optionId)) {
      // Deselect: remove id and its custom price
      control.setValue(current.filter(id => id !== optionId));
      this.optionPrices.update(prices => {
        const updated = { ...prices };
        delete updated[optionId];
        return updated;
      });
    } else {
      // Select: add id and initialize price from material default
      control.setValue([...current, optionId]);
      this.optionPrices.update(prices => ({
        ...prices,
        [optionId]: prices[optionId] ?? defaultPrice
      }));
    }
  }

  setOptionPrice(optionId: number, price: number): void {
    this.optionPrices.update(prices => ({
      ...prices,
      [optionId]: Math.max(0, Number(price) || 0)
    }));
  }

  getOptionPrice(optionId: number): number {
    return this.optionPrices()[optionId] ?? 0;
  }

  isOptionSelected(optionId: number): boolean {
    const current = (this.productForm.get('vendorMaterialOptionIds')?.value || []) as number[];
    return current.includes(optionId);
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

  onCategoryChange(): void {
    const categoryId = Number(this.productForm.get('categoryId')?.value);
    this.subcategories.set([]);
    this.productTypes.set([]);
    this.productForm.patchValue({ subCategoryId: '', productTypeId: '' });
    
    if (categoryId) {
      this.categoryService.getSubcategories(categoryId).subscribe({
        next: (subs) => this.subcategories.set(subs || []),
        error: (err) => console.error('Failed to load subcategories', err)
      });
    }
  }

  onSubcategoryChange(): void {
    const subCategoryId = Number(this.productForm.get('subCategoryId')?.value);
    this.productTypes.set([]);
    this.productForm.patchValue({ productTypeId: '' });
    
    if (subCategoryId) {
      this.categoryService.getProductTypes(subCategoryId).subscribe({
        next: (types) => this.productTypes.set(types || []),
        error: (err) => console.error('Failed to load product types', err)
      });
    }
  }

  private resolveHierarchy(productTypeId: number): void {
    this.categoryService.getCategories().subscribe((cats) => {
      this.categories.set(cats || []);
      let found = false;
      for (const cat of cats) {
        this.categoryService.getSubcategories(cat.id).subscribe((subcats) => {
          for (const subcat of subcats) {
            this.categoryService.getProductTypes(subcat.id).subscribe((types) => {
              const match = types.find((t) => t.id === productTypeId);
              if (match && !found) {
                found = true;
                this.subcategories.set(subcats);
                this.productTypes.set(types);
                this.productForm.patchValue({
                  categoryId: cat.id,
                  subCategoryId: subcat.id,
                  productTypeId: productTypeId
                });
              }
            });
          }
        });
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.value;

    // Map option IDs to materialOptions payload structure required by API.md
    const materialOptions: any[] = [];
    const selectedIds = (formValue.vendorMaterialOptionIds || []) as number[];
    const currentPrices = this.optionPrices();
    for (const optId of selectedIds) {
      materialOptions.push({
        vendorMaterialOptionId: optId,
        // Use vendor-entered price (from optionPrices), fallback to 0
        priceOption: currentPrices[optId] ?? 0
      });
    }

    const submissionData: any = {
      ...formValue,
      price: Number(formValue.price),
      basePrice: Number(formValue.price),
      productTypeId: Number(formValue.productTypeId),
      subCategoryId: Number(formValue.subCategoryId),
      materialOptions
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
