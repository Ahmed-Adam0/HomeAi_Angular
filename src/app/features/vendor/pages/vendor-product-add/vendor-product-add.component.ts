import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { of, Subject } from 'rxjs';
import { catchError, switchMap, takeUntil, debounceTime } from 'rxjs/operators';
import { VendorProductService } from '../../services/vendor-product.service';
import { CategoryService } from '../../../../features/categories/services/category.service';
import { VendorService } from '../../services/vendor.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { ICategory } from '../../../../features/categories/interfaces/icategory';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { AuthService } from '../../../auth/services/auth.service';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { CustomDropdownComponent } from '../../../../shared/components/custom-dropdown/custom-dropdown.component';

interface ILocalPreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-vendor-product-add',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    LocalizedPipe,
    AutoDirectionDirective,
    CurrencyFormatPipe,
    CustomDropdownComponent
  ],
  templateUrl: './vendor-product-add.component.html',
  styleUrl: './vendor-product-add.component.css'
})
export class VendorProductAdd implements OnInit, OnDestroy {
  private vendorProductService = inject(VendorProductService);
  private authService = inject(AuthService);
  private categoryService = inject(CategoryService);
  private vendorService = inject(VendorService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);

  private destroy$ = new Subject<void>();

  readonly submitting = signal<boolean>(false);
  readonly autoSaveStatus = signal<'synced' | 'saving'>('synced');
  
  // Data lists
  readonly categories = signal<ICategory[]>([]);
  readonly subcategories = signal<any[]>([]);
  readonly productTypes = signal<any[]>([]);
  readonly availableMaterials = signal<any[]>([]);
  readonly optionPrices = signal<Record<number, number>>({});

  // Local Previews & Upload state
  readonly localPreviews = signal<ILocalPreview[]>([]);
  readonly primaryIndex = signal<number>(0);
  isDragOver = signal<boolean>(false);

  productForm!: FormGroup;

  // Options mapped for the custom dropdown component
  readonly categoryOptions = computed(() => {
    const lang = this.translationService.currentLang();
    return this.categories().map(cat => ({
      value: cat.id,
      label: lang === 'ar' ? (cat.nameAr || cat.nameEn || '') : (cat.nameEn || cat.nameAr || '')
    }));
  });

  readonly subcategoryOptions = computed(() => {
    const lang = this.translationService.currentLang();
    return this.subcategories().map(sub => ({
      value: sub.id,
      label: lang === 'ar' ? (sub.nameAr || sub.nameEn || '') : (sub.nameEn || sub.nameAr || '')
    }));
  });

  readonly productTypeOptions = computed(() => {
    const lang = this.translationService.currentLang();
    return this.productTypes().map(pt => ({
      value: pt.id,
      label: lang === 'ar' ? (pt.nameAr || pt.nameEn || '') : (pt.nameEn || pt.nameAr || '')
    }));
  });

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
    this.loadVendorMaterials();
    this.setupAutoSaveSimulation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Revoke object URLs to avoid memory leaks
    this.localPreviews().forEach(preview => {
      URL.revokeObjectURL(preview.previewUrl);
    });
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
      vendorMaterialOptionIds: [[]]
    });
  }

  private setupAutoSaveSimulation(): void {
    this.productForm.valueChanges
      .pipe(
        debounceTime(800),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.productForm.dirty) {
          this.autoSaveStatus.set('saving');
          setTimeout(() => {
            this.autoSaveStatus.set('synced');
          }, 600);
        }
      });
  }

  // Smooth scroll helper for invalid elements
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(`sec-${sectionId}`);
    if (element) {
      const offset = 100; // spacing from top of viewport spacing
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // Categories & Hierarchies loaders
  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  private loadVendorMaterials(): void {
    this.vendorService.getVendorMaterials().subscribe({
      next: (mats) => this.availableMaterials.set(mats || []),
      error: (err) => console.error('Failed to load vendor materials', err)
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

  // Custom Dropdown Selection handlers
  onCategorySelected(categoryId: any): void {
    this.productForm.patchValue({ categoryId });
    this.productForm.get('categoryId')?.markAsDirty();
    this.productForm.get('categoryId')?.markAsTouched();
    this.onCategoryChange();
  }

  onSubcategorySelected(subCategoryId: any): void {
    this.productForm.patchValue({ subCategoryId });
    this.productForm.get('subCategoryId')?.markAsDirty();
    this.productForm.get('subCategoryId')?.markAsTouched();
    this.onSubcategoryChange();
  }

  onProductTypeSelected(productTypeId: any): void {
    this.productForm.patchValue({ productTypeId });
    this.productForm.get('productTypeId')?.markAsDirty();
    this.productForm.get('productTypeId')?.markAsTouched();
  }

  // Materials option handling
  toggleOption(optionId: number, defaultPrice: number = 0): void {
    const control = this.productForm.get('vendorMaterialOptionIds');
    if (!control) return;
    const current = (control.value || []) as number[];
    if (current.includes(optionId)) {
      control.setValue(current.filter(id => id !== optionId));
      this.optionPrices.update(prices => {
        const updated = { ...prices };
        delete updated[optionId];
        return updated;
      });
    } else {
      control.setValue([...current, optionId]);
      this.optionPrices.update(prices => ({
        ...prices,
        [optionId]: prices[optionId] ?? defaultPrice
      }));
    }
    this.productForm.get('vendorMaterialOptionIds')?.markAsDirty();
  }

  setOptionPrice(optionId: number, price: number): void {
    this.optionPrices.update(prices => ({
      ...prices,
      [optionId]: Math.max(0, Number(price) || 0)
    }));
    this.productForm.get('vendorMaterialOptionIds')?.markAsDirty();
  }

  getOptionPrice(optionId: number): number {
    return this.optionPrices()[optionId] ?? 0;
  }

  isOptionSelected(optionId: number): boolean {
    const current = (this.productForm.get('vendorMaterialOptionIds')?.value || []) as number[];
    return current.includes(optionId);
  }

  getSelectedOptionsCount(): number {
    return (this.productForm.get('vendorMaterialOptionIds')?.value || []).length;
  }

  // Drag & drop file uploading handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFiles(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFiles(input.files);
      input.value = ''; // reset
    }
  }

  private processFiles(files: FileList): void {
    const newPreviews: ILocalPreview[] = [];
    const filesArray = Array.from(files);

    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        newPreviews.push({ file, previewUrl });
      }
    });

    if (newPreviews.length > 0) {
      this.localPreviews.update(prev => [...prev, ...newPreviews]);
      if (this.localPreviews().length > 0 && this.primaryIndex() >= this.localPreviews().length) {
        this.primaryIndex.set(0);
      }
    }
  }

  removePreview(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const previews = this.localPreviews();
    const removed = previews[index];
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }

    this.localPreviews.update(prev => {
      const updated = prev.filter((_, i) => i !== index);
      
      let currentPrimary = this.primaryIndex();
      if (currentPrimary === index) {
        this.primaryIndex.set(0);
      } else if (currentPrimary > index) {
        this.primaryIndex.set(currentPrimary - 1);
      }
      return updated;
    });
  }

  setPrimaryLocal(index: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.primaryIndex.set(index);
  }

  isSectionValid(sectionId: string): boolean {
    if (sectionId === 'design') {
      return (
        (this.productForm.get('nameAr')?.valid ?? false) &&
        (this.productForm.get('nameEn')?.valid ?? false) &&
        (this.productForm.get('descriptionAr')?.valid ?? false) &&
        (this.productForm.get('descriptionEn')?.valid ?? false)
      );
    }
    if (sectionId === 'classification') {
      return (
        (this.productForm.get('categoryId')?.valid ?? false) &&
        (this.productForm.get('subCategoryId')?.valid ?? false) &&
        (this.productForm.get('productTypeId')?.valid ?? false)
      );
    }
    if (sectionId === 'pricing') {
      return this.productForm.get('price')?.valid ?? false;
    }
    if (sectionId === 'options') {
      return true;
    }
    if (sectionId === 'media') {
      return this.localPreviews().length > 0;
    }
    if (sectionId === 'review') {
      return this.productForm.valid && this.localPreviews().length > 0;
    }
    return false;
  }

  isInvalid(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Getters for Preview Panel
  getSelectedCategoryName(): string {
    const categoryId = Number(this.productForm.get('categoryId')?.value);
    if (!categoryId) return '';
    const cat = this.categories().find(c => c.id === categoryId);
    if (!cat) return '';
    return this.translationService.currentLang() === 'ar' 
      ? (cat.nameAr || cat.nameEn || '') 
      : (cat.nameEn || cat.nameAr || '');
  }

  getWorkshopName(): string {
    return this.authService.currentUser()?.name || 
      (this.translationService.currentLang() === 'ar' ? 'الورشة الخاصة بي' : 'My Workshop');
  }

  // Form actions
  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      
      // Auto-scroll to the first invalid field
      const controls = this.productForm.controls;
      for (const name in controls) {
        if (controls[name].invalid) {
          let sectionId = 'design';
          if (['categoryId', 'subCategoryId', 'productTypeId'].includes(name)) {
            sectionId = 'classification';
          } else if (name === 'price') {
            sectionId = 'pricing';
          }
          
          this.scrollToSection(sectionId);
          
          this.uiState.showAlert(
            'danger',
            this.translationService.currentLang() === 'ar'
              ? 'يرجى مراجعة وتصحيح الحقول المطلوبة باللون الأحمر.'
              : 'Please review and correct the required fields highlighted in red.'
          );
          return;
        }
      }
      return;
    }

    if (this.localPreviews().length === 0) {
      this.scrollToSection('media');
      this.uiState.showAlert(
        'warning',
        this.translationService.currentLang() === 'ar'
          ? 'يرجى إضافة صورة واحدة على الأقل للمنتج'
          : 'Please add at least one product image'
      );
      return;
    }

    const formValue = this.productForm.value;
    const isAr = this.translationService.currentLang() === 'ar';
    this.submitting.set(true);
    this.uiState.showLoader();

    // Map option IDs to materialOptions payload structure
    const materialOptions: any[] = [];
    const selectedIds = (formValue.vendorMaterialOptionIds || []) as number[];
    const currentPrices = this.optionPrices();
    for (const optId of selectedIds) {
      materialOptions.push({
        vendorMaterialOptionId: optId,
        priceOption: currentPrices[optId] ?? 0
      });
    }

    const productPayload = {
      name: formValue.nameEn || formValue.nameAr || '',
      description: formValue.descriptionEn || formValue.descriptionAr || '',
      basePrice: Number(formValue.price),
      productTypeId: Number(formValue.productTypeId),
      categoryId: Number(formValue.categoryId),
      subCategoryId: Number(formValue.subCategoryId),
      nameAr: formValue.nameAr || '',
      nameEn: formValue.nameEn || '',
      descriptionAr: formValue.descriptionAr || '',
      descriptionEn: formValue.descriptionEn || '',
      price: Number(formValue.price),
      isActive: formValue.isActive ?? true,
      materialOptions
    };

    const selectedFilesArray = this.localPreviews().map(p => p.file);

    this.vendorProductService.createProduct(productPayload).pipe(
      switchMap((createdProduct) => {
        const productId = createdProduct.id;
        
        if (selectedFilesArray.length === 0) {
          return of({ productId, images: [] });
        }
        
        return this.vendorProductService.uploadImages(productId, selectedFilesArray, this.primaryIndex()).pipe(
          switchMap((uploadedImages) => {
            return of({ productId, images: uploadedImages });
          }),
          catchError((uploadErr) => {
            console.error('Failed to upload images, but product created.', uploadErr);
            throw new Error('image_upload_failed');
          })
        );
      })
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr
            ? 'تم إنشاء المنتج ورفع الصور بنجاح.'
            : 'Product created and images uploaded successfully.'
        );
        void this.router.navigate(['/vendor/products']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.uiState.hideLoader();
        
        if (err.message === 'image_upload_failed') {
          this.uiState.showAlert(
            'warning',
            isAr
              ? 'تم إنشاء المنتج ولكن فشل رفع الصور. يمكنك المحاولة مجدداً من صفحة التعديل.'
              : 'Product created, but image upload failed. You can retry from the Edit page.'
          );
          void this.router.navigate(['/vendor/products']);
        } else {
          console.error('Product creation pipeline failed', err);
          this.uiState.showAlert(
            'danger',
            isAr
              ? 'فشل إنشاء المنتج. يرجى مراجعة البيانات والمحاولة مرة أخرى.'
              : 'Failed to create product. Please verify details and try again.'
          );
        }
      }
    });
  }

  onCancel(): void {
    void this.router.navigate(['/vendor/products']);
  }
}
