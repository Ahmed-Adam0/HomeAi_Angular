import { Component, inject, signal, OnInit, OnDestroy, computed, Input, Output, EventEmitter, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { of, Subject, forkJoin } from 'rxjs';
import { catchError, switchMap, takeUntil, debounceTime, map } from 'rxjs/operators';
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
import { DialogService } from '../../../../shared/services/dialog.service';

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
  private dialogService = inject(DialogService);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);

  private destroy$ = new Subject<void>();

  @Input() set productId(val: string | number | null) {
    this.productIdInput.set(val);
    if (val && this.productForm) {
      this.loadProduct(val);
    }
  }

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly productIdInput = signal<string | number | null>(null);
  readonly isEditMode = computed(() => this.productIdInput() !== null);
  readonly product = signal<IProduct | null>(null);
  
  readonly loading = signal<boolean>(false);
  readonly submitting = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);
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

  // 3D Model file upload variables
  readonly selected3DModelFile = signal<File | null>(null);
  readonly validationError3D = signal<string | null>(null);
  readonly isUploading3D = signal<boolean>(false);
  isDragOver3D = signal<boolean>(false);

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

    if (isPlatformBrowser(this.platformId)) {
      // Read :id from route params (routed page mode)
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        this.productIdInput.set(routeId);
        this.loadProduct(routeId);
      } else {
        // Fallback: check @Input() productId (legacy modal mode)
        const id = this.productIdInput();
        if (id) {
          this.loadProduct(id);
        }
      }
    }
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

  loadProduct(id: string | number): void {
    this.loading.set(true);
    this.vendorProductService.getProductById(id).subscribe({
      next: (prod) => {
        this.product.set(prod);
        
        // Patch main form details
        this.productForm.patchValue({
          nameAr: prod.nameAr || '',
          nameEn: prod.nameEn || '',
          descriptionAr: prod.descriptionAr || '',
          descriptionEn: prod.descriptionEn || '',
          price: prod.price || '',
          categoryId: prod.categoryId || '',
          subCategoryId: prod.subCategoryId || '',
          productTypeId: prod.productTypeId || '',
          isActive: prod.isActive ?? true,
          vendorMaterialOptionIds: prod.vendorMaterialOptionIds || []
        });

        // Map option prices to local record
        const prices: Record<number, number> = {};
        if (prod.materials && Array.isArray(prod.materials)) {
          for (const mat of prod.materials) {
            if (mat.options) {
              for (const opt of mat.options) {
                prices[opt.id] = opt.priceDelta || 0;
              }
            }
          }
        }
        this.optionPrices.set(prices);

        // Fetch subcategories
        if (prod.categoryId) {
          this.categoryService.getSubcategories(prod.categoryId).subscribe({
            next: (subs) => {
              this.subcategories.set(subs || []);
              this.productForm.patchValue({ subCategoryId: prod.subCategoryId });
            },
            error: (err) => console.error('Failed to load subcategories', err)
          });
        }

        // Fetch product types
        if (prod.subCategoryId) {
          this.categoryService.getProductTypes(prod.subCategoryId).subscribe({
            next: (types) => {
              this.productTypes.set(types || []);
              this.productForm.patchValue({ productTypeId: prod.productTypeId });
            },
            error: (err) => console.error('Failed to load product types', err)
          });
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load product details', err);
        this.uiState.showAlert(
          'danger',
          this.translationService.currentLang() === 'ar'
            ? 'فشل تحميل بيانات المنتج.'
            : 'Failed to load product details.'
        );
        this.close.emit();
      }
    });
  }

  // 3D model validation and handlers
  validateAndSet3DModel(file: File): boolean {
    this.validationError3D.set(null);
    const allowedExtensions = ['.glb', '.gltf', '.fbx', '.obj'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      const isAr = this.translationService.currentLang() === 'ar';
      this.validationError3D.set(
        isAr 
          ? 'امتداد الملف غير مدعوم. يرجى اختيار ملف بامتداد .glb, .gltf, .fbx, أو .obj.'
          : 'Unsupported file extension. Please select a .glb, .gltf, .fbx, or .obj file.'
      );
      return false;
    }
    const maxSizeBytes = 20 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const isAr = this.translationService.currentLang() === 'ar';
      this.validationError3D.set(
        isAr
          ? 'تجاوز حجم الملف الحد الأقصى (20 ميجابايت).'
          : 'File size exceeds the 20MB limit.'
      );
      return false;
    }
    this.selected3DModelFile.set(file);
    return true;
  }

  on3DModelSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isEditMode()) {
        this.upload3DModelImmediate(file);
      } else {
        this.validateAndSet3DModel(file);
      }
      input.value = '';
    }
  }

  onDragOver3D(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver3D.set(true);
  }

  onDragLeave3D(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver3D.set(false);
  }

  onDrop3D(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver3D.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (this.isEditMode()) {
        this.upload3DModelImmediate(file);
      } else {
        this.validateAndSet3DModel(file);
      }
    }
  }

  remove3DModelLocal(): void {
    this.selected3DModelFile.set(null);
    this.validationError3D.set(null);
  }

  upload3DModelImmediate(file: File): void {
    if (!this.validateAndSet3DModel(file)) return;
    const isAr = this.translationService.currentLang() === 'ar';
    const prodId = this.productIdInput();
    if (!prodId) return;

    this.isUploading3D.set(true);
    this.uiState.showLoader();

    this.vendorProductService.upload3DModel(prodId, file).subscribe({
      next: (res) => {
        this.isUploading3D.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم رفع النموذج ثلاثي الأبعاد بنجاح.' : '3D model uploaded successfully.'
        );
        this.remove3DModelLocal();
        this.loadProduct(prodId);
      },
      error: (err) => {
        console.error('Failed to upload 3D model', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل رفع النموذج ثلاثي الأبعاد.' : 'Failed to upload 3D model.'
        );
        this.isUploading3D.set(false);
        this.uiState.hideLoader();
      }
    });
  }

  async delete3DModelServer(): Promise<void> {
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = await this.dialogService.openConfirm({
      title: isAr ? 'حذف النموذج ثلاثي الأبعاد' : 'Delete 3D Model',
      message: isAr ? 'هل أنت متأكد من رغبتك في حذف هذا النموذج ثلاثي الأبعاد؟' : 'Are you sure you want to delete this 3D model?',
      confirmText: isAr ? 'حذف' : 'Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
    });
    if (!confirmed) return;

    const prodId = this.productIdInput();
    if (!prodId) return;

    this.uiState.showLoader();
    this.vendorProductService.delete3DModel(prodId).subscribe({
      next: () => {
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم حذف النموذج ثلاثي الأبعاد بنجاح.' : '3D model deleted successfully.'
        );
        this.loadProduct(prodId);
      },
      error: (err) => {
        console.error('Failed to delete 3D model', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل حذف النموذج ثلاثي الأبعاد.' : 'Failed to delete 3D model.'
        );
        this.uiState.hideLoader();
      }
    });
  }

  uploadNewImages(files: File[]): void {
    const isAr = this.translationService.currentLang() === 'ar';
    this.uploading.set(true);
    this.uiState.showLoader();

    const prodId = this.productIdInput();
    if (!prodId) return;

    this.vendorProductService.uploadImages(prodId, files).subscribe({
      next: () => {
        this.uploading.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم رفع الصور بنجاح.' : 'Images uploaded successfully.'
        );
        this.loadProduct(prodId);
      },
      error: (err) => {
        console.error('Failed to upload images', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل رفع الصور.' : 'Failed to upload images.'
        );
        this.uploading.set(false);
        this.uiState.hideLoader();
      }
    });
  }

  async onDeleteImage(imageId: number, event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();

    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = await this.dialogService.openConfirm({
      title: isAr ? 'حذف الصورة' : 'Delete Image',
      message: isAr ? 'هل أنت متأكد من رغبتك في حذف هذه الصورة؟' : 'Are you sure you want to delete this image?',
      confirmText: isAr ? 'حذف' : 'Delete',
      cancelText: isAr ? 'إلغاء' : 'Cancel',
    });

    if (!confirmed) return;

    const prodId = this.productIdInput();
    if (!prodId) return;

    this.uiState.showLoader();
    this.vendorProductService.deleteImage(prodId, imageId).subscribe({
      next: () => {
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم حذف الصورة بنجاح.' : 'Image deleted successfully.'
        );
        this.loadProduct(prodId);
      },
      error: (err) => {
        console.error('Failed to delete image', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل حذف الصورة.' : 'Failed to delete image.'
        );
        this.uiState.hideLoader();
      }
    });
  }

  onSetPrimaryImage(imageId: number, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const isAr = this.translationService.currentLang() === 'ar';
    const prodId = this.productIdInput();
    if (!prodId) return;

    this.uiState.showLoader();
    this.vendorProductService.setPrimaryImage(prodId, imageId).subscribe({
      next: () => {
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr ? 'تم تعيين الصورة كغلاف رئيسي.' : 'Image set as primary cover successfully.'
        );
        this.loadProduct(prodId);
      },
      error: (err) => {
        console.error('Failed to set primary image', err);
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل تعيين الصورة الرئيسية.' : 'Failed to set primary image.'
        );
        this.uiState.hideLoader();
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
    const filesArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (filesArray.length > 0) {
      if (this.isEditMode()) {
        this.uploadNewImages(filesArray);
      } else {
        const newPreviews: ILocalPreview[] = [];
        filesArray.forEach(file => {
          const previewUrl = URL.createObjectURL(file);
          newPreviews.push({ file, previewUrl });
        });
        this.localPreviews.update(prev => [...prev, ...newPreviews]);
        if (this.localPreviews().length > 0 && this.primaryIndex() >= this.localPreviews().length) {
          this.primaryIndex.set(0);
        }
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
      return this.isEditMode()
        ? (this.product()?.images?.length ?? 0) > 0
        : this.localPreviews().length > 0;
    }
    if (sectionId === 'review') {
      const hasImages = this.isEditMode()
        ? (this.product()?.images?.length ?? 0) > 0
        : this.localPreviews().length > 0;
      return this.productForm.valid && hasImages;
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

  getProductCoverUrl(): string {
    const images = this.product()?.images || [];
    const primary = images.find(img => img.isPrimary);
    if (primary) return primary.imageUrl;
    if (images.length > 0) return images[0].imageUrl;
    return 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80';
  }

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

    if (this.isEditMode()) {
      const prodId = this.productIdInput();
      if (!prodId) return;

      if ((this.product()?.images?.length ?? 0) === 0) {
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
        materialOptions
      };

      const currentActive = this.product()?.isActive ?? true;
      const newActive = formValue.isActive ?? true;
      const statusChanged = currentActive !== newActive;

      const updateObs = this.vendorProductService.updateProduct(prodId, productPayload);
      const statusObs = statusChanged
        ? this.vendorProductService.updateProductStatus(prodId, newActive)
        : of(null);

      forkJoin([updateObs, statusObs]).subscribe({
        next: () => {
          this.submitting.set(false);
          this.uiState.hideLoader();
          this.uiState.showAlert(
            'success',
            isAr
              ? 'تم حفظ تفاصيل المنتج بنجاح.'
              : 'Product details saved successfully.'
          );
          this.saved.emit();
          this.navigateToProducts();
        },
        error: (err) => {
          console.error('Failed to update product', err);
          this.uiState.showAlert(
            'danger',
            isAr
              ? 'فشل تحديث بيانات المنتج.'
              : 'Failed to update product details.'
          );
          this.submitting.set(false);
          this.uiState.hideLoader();
        }
      });
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
        
        const uploadImages$ = selectedFilesArray.length > 0
          ? this.vendorProductService.uploadImages(productId, selectedFilesArray, this.primaryIndex()).pipe(
              catchError((uploadErr) => {
                console.error('Failed to upload images, but product created.', uploadErr);
                throw new Error('image_upload_failed');
              })
            )
          : of([]);

        const modelFile = this.selected3DModelFile();
        return uploadImages$.pipe(
          switchMap(() => {
            if (modelFile) {
              return this.vendorProductService.upload3DModel(productId, modelFile).pipe(
                catchError((modelErr) => {
                  console.error('Failed to upload 3D model, but product created.', modelErr);
                  throw new Error('3d_upload_failed');
                })
              );
            }
            return of(null);
          }),
          map(() => createdProduct)
        );
      })
    ).subscribe({
      next: () => {
        this.submitting.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert(
          'success',
          isAr
            ? 'تم إنشاء المنتج ورفع الملفات بنجاح.'
            : 'Product created and files uploaded successfully.'
        );
        this.saved.emit();
        this.navigateToProducts();
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
          this.saved.emit();
          this.navigateToProducts();
        } else if (err.message === '3d_upload_failed') {
          this.uiState.showAlert(
            'warning',
            isAr
              ? 'تم إنشاء المنتج وصوره بنجاح. فشل رفع النموذج ثلاثي الأبعاد.'
              : 'Product and images created successfully. 3D model upload failed.'
          );
          this.saved.emit();
          this.navigateToProducts();
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
    this.navigateToProducts();
  }

  private navigateToProducts(): void {
    this.router.navigate(['/vendor/products']);
  }
}
