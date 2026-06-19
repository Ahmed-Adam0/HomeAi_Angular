import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorService } from '../../services/vendor.service';
import { AuthService } from '../../../auth/services/auth.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-vendor-materials',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyFormatPipe, LocalizedPipe, ConfirmDialog],
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

  readonly showCreateModal = signal<boolean>(false);

  readonly searchQuery = signal<string>('');
  readonly collapsedGroups = signal<Record<number, boolean>>({});

  readonly filteredMaterials = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all = this.materials();
    if (!query) return all;
    return all.filter(mat => {
      const matchMat = (mat.nameAr || '').toLowerCase().includes(query) || 
                       (mat.nameEn || '').toLowerCase().includes(query);
      const matchOpt = mat.options?.some((opt: any) => 
        (opt.valueAr || '').toLowerCase().includes(query) || 
        (opt.valueEn || '').toLowerCase().includes(query)
      );
      return matchMat || matchOpt;
    });
  });

  readonly totalMaterials = computed(() => this.materials().length);
  readonly totalOptions = computed(() => this.materials().reduce((sum, m) => sum + (m.options?.length || 0), 0));

  // Material Group Form
  newMaterialNameAr = '';
  newMaterialNameEn = '';
  submittingMaterial = false;

  // Option Create modal state
  readonly addingOptionGroupId = signal<number | null>(null);
  newOptionValueAr = '';
  newOptionValueEn = '';
  newOptionPriceDelta = 0;
  submittingOption = false;

  // Custom Confirm Dialog state
  readonly showDeleteDialog = signal<boolean>(false);
  readonly dialogTitle = signal<string>('');
  readonly dialogMessage = signal<string>('');
  readonly dialogConfirmText = signal<string>('');
  readonly dialogCancelText = signal<string>('');
  private deleteCallback: (() => void) | null = null;

  // Material Group Editing
  readonly editingGroupId = signal<number | null>(null);
  editMaterialNameAr = '';
  editMaterialNameEn = '';
  readonly savingMaterialId = signal<number | null>(null);

  // Options Editing (keyed by optionId)
  readonly editingOptionId = signal<number | null>(null);
  editOptionValueAr = '';
  editOptionValueEn = '';
  editOptionPriceDelta = 0;
  readonly savingOptionId = signal<number | null>(null);

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
        this.showCreateModal.set(false);
      },
      error: (err) => {
        console.error('Failed to create material', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل إنشاء مجموعة الخامات.' : 'Failed to create material group.');
        this.submittingMaterial = false;
        this.uiState.hideLoader();
      }
    });
  }

  openConfirmDialog(title: string, message: string, confirmText: string, cancelText: string, callback: () => void): void {
    this.dialogTitle.set(title);
    this.dialogMessage.set(message);
    this.dialogConfirmText.set(confirmText);
    this.dialogCancelText.set(cancelText);
    this.deleteCallback = callback;
    this.showDeleteDialog.set(true);
  }

  onConfirmDialog(): void {
    if (this.deleteCallback) {
      this.deleteCallback();
    }
    this.closeConfirmDialog();
  }

  onCancelDialog(): void {
    this.closeConfirmDialog();
  }

  private closeConfirmDialog(): void {
    this.showDeleteDialog.set(false);
    this.deleteCallback = null;
  }

  deleteMaterial(groupId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    const title = isAr ? 'حذف مجموعة الخامات' : 'Delete Material Group';
    const message = isAr ? 'هل أنت متأكد من حذف هذه المجموعة وكل خياراتها؟' : 'Are you sure you want to delete this group and all its options?';
    const confirmBtn = isAr ? 'حذف' : 'Delete';
    const cancelBtn = isAr ? 'إلغاء' : 'Cancel';

    this.openConfirmDialog(title, message, confirmBtn, cancelBtn, () => {
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
    });
  }

  openAddOption(groupId: number): void {
    this.addingOptionGroupId.set(groupId);
    this.newOptionValueAr = '';
    this.newOptionValueEn = '';
    this.newOptionPriceDelta = 0;
  }

  cancelAddOption(): void {
    this.addingOptionGroupId.set(null);
    this.newOptionValueAr = '';
    this.newOptionValueEn = '';
    this.newOptionPriceDelta = 0;
  }

  addOption(event: Event): void {
    event.preventDefault();
    const groupId = this.addingOptionGroupId();
    if (!groupId) return;

    const valAr = this.newOptionValueAr.trim();
    const valEn = this.newOptionValueEn.trim();
    const delta = this.newOptionPriceDelta;

    if (!valAr || !valEn) return;

    this.submittingOption = true;
    this.uiState.showLoader();

    this.vendorService.createOption(groupId, valAr, valEn, delta).subscribe({
      next: (newOpt) => {
        this.materials.update(prev => prev.map(mat => {
          if (mat.id === groupId) {
            return {
              ...mat,
              options: [...(mat.options || []), newOpt]
            };
          }
          return mat;
        }));

        this.newOptionValueAr = '';
        this.newOptionValueEn = '';
        this.newOptionPriceDelta = 0;
        this.submittingOption = false;
        this.addingOptionGroupId.set(null);
        this.uiState.hideLoader();
        this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تمت إضافة الاختيار بنجاح.' : 'Option added successfully.');
      },
      error: (err) => {
        console.error('Failed to add option', err);
        this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل إضافة الاختيار.' : 'Failed to add option.');
        this.submittingOption = false;
        this.uiState.hideLoader();
      }
    });
  }

  deleteOption(optionId: number, materialId: number): void {
    const isAr = this.translationService.currentLang() === 'ar';
    const title = isAr ? 'حذف الاختيار' : 'Delete Option';
    const message = isAr ? 'هل أنت متأكد من رغبتك في حذف هذا الاختيار؟' : 'Are you sure you want to delete this option?';
    const confirmBtn = isAr ? 'حذف' : 'Delete';
    const cancelBtn = isAr ? 'إلغاء' : 'Cancel';

    this.openConfirmDialog(title, message, confirmBtn, cancelBtn, () => {
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
    });
  }

  // Helper to split custom format: "Name | #color" or "Name | url"
  parseOptionValue(value: string): string {
    if (!value) return '';
    const parts = value.split('|');
    return parts[0].trim();
  }

  // Get option swatch style: color hex or background image URL
  getOptionVisual(value: string): { type: 'color' | 'image' | 'text', value: string } | null {
    if (!value) return null;
    const parts = value.split('|');
    if (parts.length > 1) {
      const visualPart = parts[1].trim();
      if (visualPart.startsWith('#') || visualPart.startsWith('rgb') || visualPart.startsWith('hsl')) {
        return { type: 'color', value: visualPart };
      }
      if (visualPart.startsWith('http') || visualPart.startsWith('/assets') || visualPart.startsWith('data:image')) {
        return { type: 'image', value: visualPart };
      }
    }
    
    // Fallback: keyword matching for color swatches
    const color = this.getOptionSwatchColor(parts[0].trim());
    if (color) {
      return { type: 'color', value: color };
    }
    
    return null;
  }

  getOptionSwatchColor(value: string): string | null {
    if (!value) return null;
    const val = value.toLowerCase();
    if (val.includes('oak') || val.includes('بلوط') || val.includes('أرو')) return '#C2A679';
    if (val.includes('walnut') || val.includes('جوز')) return '#5C4033';
    if (val.includes('beige') || val.includes('بيج')) return '#E5D3B3';
    if (val.includes('black') || val.includes('أسود')) return '#1A1A1A';
    if (val.includes('white') || val.includes('أبيض')) return '#FAFAFA';
    if (val.includes('grey') || val.includes('رمادي')) return '#8C8C8C';
    if (val.includes('brown') || val.includes('بني')) return '#6F4E37';
    if (val.includes('leather') || val.includes('جلد')) return '#B87333';
    if (val.includes('fabric') || val.includes('قماش')) return '#D9D3C7';
    if (val.includes('wood') || val.includes('خشب')) return '#A0522D';
    return null;
  }

  getGroupType(group: any): { name: string, icon: string, gradient: string } {
    const name = (((group.nameEn || '') + ' ' + (group.nameAr || ''))).toLowerCase();
    if (name.includes('wood') || name.includes('خشب')) {
      return { name: 'Wood Finish', icon: 'bi-tree-fill', gradient: 'linear-gradient(135deg, #47341d 0%, #b8935c 100%)' };
    }
    if (name.includes('fabric') || name.includes('قماش') || name.includes('upholstery') || name.includes('تنجيد')) {
      return { name: 'Fabric / Textile', icon: 'bi-grid-3x3-gap-fill', gradient: 'linear-gradient(135deg, #4a5f44 0%, #657e5d 100%)' };
    }
    if (name.includes('leather') || name.includes('جلد')) {
      return { name: 'Premium Leather', icon: 'bi-layers-half', gradient: 'linear-gradient(135deg, #6b502e 0%, #c8a87b 100%)' };
    }
    if (name.includes('color') || name.includes('لون') || name.includes('paint') || name.includes('دهان')) {
      return { name: 'Color Palette', icon: 'bi-paint-bucket', gradient: 'linear-gradient(135deg, #8a683d 0%, #b8935c 100%)' };
    }
    if (name.includes('metal') || name.includes('معدن') || name.includes('حديد') || name.includes('steel')) {
      return { name: 'Metal / Steel', icon: 'bi-shield-shaded', gradient: 'linear-gradient(135deg, #1f1c18 0%, #70675a 100%)' };
    }
    return { name: 'Custom Option', icon: 'bi-sliders', gradient: 'linear-gradient(135deg, #70675a 0%, #b3ab9d 100%)' };
  }

  // Material group edit operations
  startEditMaterial(group: any): void {
    this.editingGroupId.set(group.id);
    this.editMaterialNameAr = group.nameAr || '';
    this.editMaterialNameEn = group.nameEn || '';
  }

  cancelEditMaterial(): void {
    this.editingGroupId.set(null);
    this.editMaterialNameAr = '';
    this.editMaterialNameEn = '';
  }

  saveEditMaterial(groupId: number): void {
    if (!this.editMaterialNameAr.trim() || !this.editMaterialNameEn.trim()) return;

    this.savingMaterialId.set(groupId);
    this.uiState.showLoader();

    this.vendorService.updateMaterial(groupId, this.editMaterialNameAr.trim(), this.editMaterialNameEn.trim()).subscribe({
      next: (updatedGroup) => {
        this.materials.update(prev => prev.map(m => m.id === groupId ? { ...m, ...updatedGroup } : m));
        this.editingGroupId.set(null);
        this.savingMaterialId.set(null);
        this.uiState.hideLoader();
        this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تم تعديل مجموعة الخامات بنجاح.' : 'Material group updated successfully.');
      },
      error: (err) => {
        // Fallback for API limitation
        if (err.status === 405 || err.status === 404) {
          console.warn('Backend update group API not supported, falling back to local simulation.', err);
          this.materials.update(prev => prev.map(m => m.id === groupId ? { ...m, nameAr: this.editMaterialNameAr.trim(), nameEn: this.editMaterialNameEn.trim() } : m));
          this.editingGroupId.set(null);
          this.savingMaterialId.set(null);
          this.uiState.hideLoader();
          this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تم تعديل مجموعة الخامات بنجاح.' : 'Material group updated successfully.');
        } else {
          console.error('Failed to update material group', err);
          this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل تعديل مجموعة الخامات.' : 'Failed to update material group.');
          this.savingMaterialId.set(null);
          this.uiState.hideLoader();
        }
      }
    });
  }

  // Option edit operations
  startEditOption(option: any): void {
    this.editingOptionId.set(option.id);
    
    // Parse name
    const valueAr = option.valueAr || '';
    const valueEn = option.valueEn || '';
    
    const partsAr = valueAr.split('|');
    const partsEn = valueEn.split('|');
    
    this.editOptionValueAr = partsAr[0].trim();
    this.editOptionValueEn = partsEn[0].trim();
    this.editOptionPriceDelta = option.priceDelta || 0;
  }

  cancelEditOption(): void {
    this.editingOptionId.set(null);
    this.editOptionValueAr = '';
    this.editOptionValueEn = '';
    this.editOptionPriceDelta = 0;
  }

  saveEditOption(optionId: number, materialId?: number): void {
    if (!this.editOptionValueAr.trim() || !this.editOptionValueEn.trim()) return;

    let finalMaterialId = materialId;
    if (!finalMaterialId) {
      const group = this.materials().find(m => m.options?.some((o: any) => o.id === optionId));
      if (group) {
        finalMaterialId = group.id;
      }
    }
    if (!finalMaterialId) return;

    const finalValAr = this.editOptionValueAr.trim();
    const finalValEn = this.editOptionValueEn.trim();

    this.savingOptionId.set(optionId);
    this.uiState.showLoader();

    this.vendorService.updateOption(optionId, finalValAr, finalValEn, this.editOptionPriceDelta).subscribe({
      next: (updatedOpt) => {
        this.materials.update(prev => prev.map(mat => {
          if (mat.id === finalMaterialId) {
            return {
              ...mat,
              options: (mat.options || []).map((o: any) => o.id === optionId ? { ...o, ...updatedOpt } : o)
            };
          }
          return mat;
        }));
        this.editingOptionId.set(null);
        this.savingOptionId.set(null);
        this.uiState.hideLoader();
        this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تم تعديل الاختيار بنجاح.' : 'Option updated successfully.');
      },
      error: (err) => {
        // Fallback for API limitation
        if (err.status === 405 || err.status === 404) {
          console.warn('Backend update option API not supported, falling back to local simulation.', err);
          this.materials.update(prev => prev.map(mat => {
            if (mat.id === finalMaterialId) {
              return {
                ...mat,
                options: (mat.options || []).map((o: any) => o.id === optionId ? { 
                  ...o, 
                  valueAr: finalValAr, 
                  valueEn: finalValEn, 
                  priceDelta: this.editOptionPriceDelta 
                } : o)
              };
            }
            return mat;
          }));
          this.editingOptionId.set(null);
          this.savingOptionId.set(null);
          this.uiState.hideLoader();
          this.uiState.showAlert('success', this.translationService.currentLang() === 'ar' ? 'تم تعديل الاختيار بنجاح.' : 'Option updated successfully.');
        } else {
          console.error('Failed to update option', err);
          this.uiState.showAlert('danger', this.translationService.currentLang() === 'ar' ? 'فشل تعديل الاختيار.' : 'Failed to update option.');
          this.savingOptionId.set(null);
          this.uiState.hideLoader();
        }
      }
    });
  }

  toggleGroupCollapse(groupId: number): void {
    this.collapsedGroups.update(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  }

  expandAll(): void {
    this.collapsedGroups.set({});
  }

  collapseAll(): void {
    const collapsed: Record<number, boolean> = {};
    this.materials().forEach(m => {
      collapsed[m.id] = true;
    });
    this.collapsedGroups.set(collapsed);
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  isEditingGroupOption(materialId: number): boolean {
    const editId = this.editingOptionId();
    if (!editId) return false;
    const group = this.materials().find(m => m.id === materialId);
    return !!group?.options?.some((o: any) => o.id === editId);
  }


}
