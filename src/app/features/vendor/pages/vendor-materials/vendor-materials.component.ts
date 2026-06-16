import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorService } from '../../services/vendor.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-vendor-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, LocalizedPipe, TranslatePipe],
  templateUrl: './vendor-materials.component.html',
  styleUrl: './vendor-materials.component.css'
})
export class VendorMaterials implements OnInit {
  private vendorService = inject(VendorService);
  private authService = inject(AuthService);
  private uiState = inject(UiState);
  readonly translationService = inject(TranslationService);

  readonly materials = signal<any[]>([]);
  readonly loading = signal<boolean>(true);

  // Material Group Form
  newMaterialNameAr = '';
  newMaterialNameEn = '';
  submittingMaterial = false;

  // Options Forms state (keyed by materialId)
  newOptionValuesAr: Record<number, string> = {};
  newOptionValuesEn: Record<number, string> = {};
  newOptionPriceDeltas: Record<number, number> = {};
  submittingOptions: Record<number, boolean> = {};

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading.set(true);
    this.vendorService.getVendorMaterials().subscribe({
      next: (data) => {
        this.materials.set(data || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load vendor materials', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل تحميل الخامات.' : 'Failed to load materials.');
        this.loading.set(false);
      }
    });
  }

  addMaterial(event: Event): void {
    event.preventDefault();
    if (!this.newMaterialNameAr.trim() || !this.newMaterialNameEn.trim()) return;

    this.submittingMaterial = true;
    this.uiState.showLoader();

    this.vendorService.createMaterial(this.newMaterialNameAr.trim(), this.newMaterialNameEn.trim()).subscribe({
      next: (newMat) => {
        this.materials.update(prev => [...prev, { ...newMat, options: [] }]);
        this.newMaterialNameAr = '';
        this.newMaterialNameEn = '';
        this.submittingMaterial = false;
        this.uiState.hideLoader();
        this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تم إنشاء مجموعة الخامات بنجاح.' : 'Material group created successfully.');
      },
      error: (err) => {
        console.error('Failed to create material', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل إنشاء مجموعة الخامات.' : 'Failed to create material group.');
        this.submittingMaterial = false;
        this.uiState.hideLoader();
      }
    });
  }

  deleteMaterial(groupId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = confirm(isAr ? 'هل أنت متأكد من حذف هذه المجموعة وكل خياراتها؟' : 'Are you sure you want to delete this group and all its options?');
    if (!confirmed) return;

    this.uiState.showLoader();
    this.vendorService.deleteMaterial(groupId).subscribe({
      next: () => {
        this.materials.update(prev => prev.filter(m => m.id !== groupId));
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم حذف مجموعة الخامات بنجاح.' : 'Material group deleted successfully.');
      },
      error: (err) => {
        console.error('Failed to delete material group', err);
        this.uiState.showAlert('danger', isAr ? 'فشل حذف مجموعة الخامات.' : 'Failed to delete material group.');
        this.uiState.hideLoader();
      }
    });
  }

  addOption(materialId: number): void {
    const valAr = this.newOptionValuesAr[materialId]?.trim();
    const valEn = this.newOptionValuesEn[materialId]?.trim();
    const delta = this.newOptionPriceDeltas[materialId] ?? 0;

    if (!valAr || !valEn) return;

    this.submittingOptions[materialId] = true;
    this.uiState.showLoader();

    this.vendorService.createOption(materialId, valAr, valEn, delta).subscribe({
      next: (newOpt) => {
        this.materials.update(prev => prev.map(mat => {
          if (mat.id === materialId) {
            return {
              ...mat,
              options: [...(mat.options || []), newOpt]
            };
          }
          return mat;
        }));

        this.newOptionValuesAr[materialId] = '';
        this.newOptionValuesEn[materialId] = '';
        this.newOptionPriceDeltas[materialId] = 0;
        this.submittingOptions[materialId] = false;
        this.uiState.hideLoader();
        this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تمت إضافة الاختيار بنجاح.' : 'Option added successfully.');
      },
      error: (err) => {
        console.error('Failed to add option', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل إضافة الاختيار.' : 'Failed to add option.');
        this.submittingOptions[materialId] = false;
        this.uiState.hideLoader();
      }
    });
  }

  deleteOption(optionId: number, materialId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    const confirmed = confirm(isAr ? 'هل أنت متأكد من رغبتك في حذف هذا الاختيار؟' : 'Are you sure you want to delete this option?');
    if (!confirmed) return;

    this.uiState.showLoader();
    this.vendorService.deleteOption(optionId).subscribe({
      next: () => {
        this.materials.update(prev => prev.map(mat => {
          if (mat.id === materialId) {
            return {
              ...mat,
              options: (mat.options || []).filter((o: any) => o.id !== optionId)
            };
          }
          return mat;
        }));
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم حذف الاختيار بنجاح.' : 'Option deleted successfully.');
      },
      error: (err) => {
        console.error('Failed to delete option', err);
        this.uiState.showAlert('danger', isAr ? 'فشل حذف الاختيار.' : 'Failed to delete option.');
        this.uiState.hideLoader();
      }
    });
  }
}
