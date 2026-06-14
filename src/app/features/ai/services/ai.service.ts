import { Injectable, signal, computed, inject } from '@angular/core';
import { IProduct } from '../../products/interfaces/iproduct';
import { CartService } from '../../cart/services/cart.service';

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Hotspot {
  id: number;
  label: string;
  x: number; // percentage from left
  y: number; // percentage from top
  productId: number;
}

export interface RoomConfig {
  id: string;
  name: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

@Injectable({
  providedIn: 'root',
})
export class AiService {
  private readonly cartService = inject(CartService);

  // Core Mock Products Database conforming to IProduct
  readonly productsDb = signal<IProduct[]>([
    {
      id: 101,
      nameEn: 'Nordic Lounge Sofa',
      nameAr: 'أريكة صالة نورديك',
      descriptionEn: 'A premium minimalist sofa with deep cashmere comfort and refined solid ash wood framing.',
      descriptionAr: 'أريكة صالة فاخرة ومبسطة مع راحة عميقة من الكشمير وإطار مكرر من الخشب الصلب.',
      price: 1850,
      categoryId: 1,
      categoryNameEn: 'Sofas',
      categoryNameAr: 'كنب وأرائك',
      workshopId: 10,
      workshopNameEn: 'STUDIO CPH',
      workshopNameAr: 'ستوديو سي بي إتش',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 102,
      nameEn: 'Atelier Coffee Table',
      nameAr: 'طاولة قهوة أتيليه',
      descriptionEn: 'Crafted solid walnut table featuring double-layered design and tempered glass elements.',
      descriptionAr: 'طاولة مصنوعة من خشب الجوز الصلب تتميز بتصميم مزدوج الطبقات وعناصر زجاجية مقواة.',
      price: 890,
      categoryId: 5,
      categoryNameEn: 'Tables',
      categoryNameAr: 'طاولات',
      workshopId: 11,
      workshopNameEn: 'CRAFTED LIVING',
      workshopNameAr: 'كرافتد ليفينج',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 103,
      nameEn: 'Arc Floor Lamp',
      nameAr: 'مصباح أرضي منحني',
      descriptionEn: 'An elegant arc floor lamp with a heavy brushed brass dome shade and adjustable height.',
      descriptionAr: 'مصباح أرضي مقوس أنيق مع مظلة قبة نحاسية مصقولة ثقيلة وارتفاع قابل للتعديل.',
      price: 450,
      categoryId: 7,
      categoryNameEn: 'Lighting',
      categoryNameAr: 'إضاءة',
      workshopId: 12,
      workshopNameEn: 'LUMINA',
      workshopNameAr: 'لومينا',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 104,
      nameEn: 'Minimalist Sideboard',
      nameAr: 'خزانة جانبية مبسطة',
      descriptionEn: 'Sleek storage credenza made from warm oak wood veneer and thin black metal legs.',
      descriptionAr: 'خزانة تخزين أنيقة مصنوعة من قشرة خشب البلوط الدافئة وأرجل معدنية سوداء رفيعة.',
      price: 1200,
      categoryId: 6,
      categoryNameEn: 'Cabinets',
      categoryNameAr: 'خزائن',
      workshopId: 13,
      workshopNameEn: 'HAVEN',
      workshopNameAr: 'هافن',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 105,
      nameEn: 'Minimal Lounge Chair',
      nameAr: 'كرسي صالة مبسط',
      descriptionEn: 'Premium mid-century accent chair featuring ivory bouclé fabric upholstery and oak legs.',
      descriptionAr: 'كرسي متميز بتصميم كلاسيكي حديث يتميز بتنجيد قماش البوكلي العاجي وأرجل بلوط.',
      price: 850,
      categoryId: 3,
      categoryNameEn: 'Chairs',
      categoryNameAr: 'كراسي',
      workshopId: 13,
      workshopNameEn: 'HAVEN',
      workshopNameAr: 'هافن',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 106,
      nameEn: 'Classic Leather Sofa',
      nameAr: 'أريكة جلدية كلاسيكية',
      descriptionEn: 'Luxury top-grain tan leather sofa with hand-tufted cushions and sturdy mahogany feet.',
      descriptionAr: 'أريكة جلدية فاخرة بلون بني كستنائي مع وسائد مبطنة يدوياً وأرجل من خشب الماهوجني المتين.',
      price: 2200,
      categoryId: 1,
      categoryNameEn: 'Sofas',
      categoryNameAr: 'كنب وأرائك',
      workshopId: 14,
      workshopNameEn: 'ROCHE BOBOIS',
      workshopNameAr: 'روش بوبوا',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=600&auto=format&fit=crop',
    },
    {
      id: 107,
      nameEn: 'Glass Coffee Table',
      nameAr: 'طاولة قهوة زجاجية',
      descriptionEn: 'Contemporary coffee table made of thick tempered glass and solid brass legs.',
      descriptionAr: 'طاولة قهوة معاصرة مصنوعة من الزجاج المقوى السميك وأرجل نحاسية صلبة.',
      price: 650,
      categoryId: 5,
      categoryNameEn: 'Tables',
      categoryNameAr: 'طاولات',
      workshopId: 12,
      workshopNameEn: 'LUMINA',
      workshopNameAr: 'لومينا',
      createdAt: new Date().toISOString(),
      mainImageUrl: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?q=80&w=600&auto=format&fit=crop',
    }
  ]);

  // Customizable states for room items
  readonly selectedColor = signal<Record<number, string>>({
    101: 'Tan Leather',
    102: 'Natural Wood',
    103: 'Brass',
    104: 'Oak',
    105: 'Ivory',
    106: 'Cognac',
    107: 'Clear'
  });

  readonly selectedMaterial = signal<Record<number, string>>({
    101: 'Linen Blend Fabric',
    102: 'Solid Wood & Glass',
    103: 'Brushed Brass',
    104: 'Wood Veneer & Metal',
    105: 'Bouclé Fabric',
    106: 'Top-Grain Leather',
    107: 'Tempered Glass & Metal'
  });

  readonly selectedWoodType = signal<Record<number, string>>({
    101: 'Solid Ash Wood',
    102: 'Walnut',
    103: 'N/A',
    104: 'Oak',
    105: 'Oak',
    106: 'Mahogany',
    107: 'N/A'
  });

  readonly dimensions = signal<Record<number, string>>({
    101: '220W x 90D x 85H cm',
    102: '120W x 80D x 40H cm',
    103: '210H x 150W cm',
    104: '180W x 45D x 75H cm',
    105: '85W x 90D x 100H cm',
    106: '235W x 95D x 88H cm',
    107: '110W x 70D x 42H cm'
  });

  // Current room configuration
  readonly activeRoomIndex = signal<number>(0);
  readonly rooms = signal<RoomConfig[]>([
    {
      id: 'living_room',
      name: 'Living Room',
      imageUrl: 'assets/images/room_living.png',
      hotspots: [
        { id: 1, label: 'Coffee Table', x: 61, y: 67, productId: 102 },
        { id: 2, label: 'Sideboard', x: 58, y: 73, productId: 104 },
        { id: 3, label: 'Floor Lamp', x: 40, y: 42, productId: 103 },
        { id: 4, label: 'Sofa', x: 79, y: 54, productId: 101 },
      ],
    },
    {
      id: 'bedroom',
      name: 'Bedroom',
      imageUrl: 'assets/images/room_bedroom.png',
      hotspots: [
        { id: 1, label: 'Bed Frame', x: 50, y: 55, productId: 101 }, // uses mock sofa as placeholder
        { id: 2, label: 'Nightstand', x: 30, y: 65, productId: 102 },
        { id: 3, label: 'Reading Light', x: 28, y: 45, productId: 103 },
      ]
    }
  ]);

  readonly currentRoom = computed(() => this.rooms()[this.activeRoomIndex()]);

  // Sidebar / Selection state
  readonly selectedHotspotId = signal<number | null>(null);
  readonly isSidebarOpen = signal<boolean>(false);

  readonly selectedHotspot = computed(() => {
    const hsId = this.selectedHotspotId();
    if (hsId === null) return null;
    return this.currentRoom().hotspots.find(h => h.id === hsId) || null;
  });

  readonly selectedProduct = computed<IProduct | null>(() => {
    const hs = this.selectedHotspot();
    if (!hs) return null;
    return this.productsDb().find(p => p.id === hs.productId) || null;
  });

  // Modals visibilities
  readonly isSummaryOpen = signal<boolean>(false);
  readonly isInspirationOpen = signal<boolean>(false);

  // Chat message history
  readonly messages = signal<ChatMessage[]>([
    { sender: 'user', text: 'I want a modern living room', timestamp: new Date(Date.now() - 600000) },
    { sender: 'ai', text: 'I created a design for you using products from our marketplace.', timestamp: new Date(Date.now() - 540000) },
    { sender: 'user', text: 'Change the wood type to Oak', timestamp: new Date(Date.now() - 480000) },
    { sender: 'ai', text: 'Updated successfully. I have swapped the tables and shelving to natural oak finishes.', timestamp: new Date(Date.now() - 420000) },
  ]);

  readonly isTyping = signal<boolean>(false);

  // Inspiration Analysis mock state
  readonly uploadedInspirationImage = signal<string>('https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=600&auto=format&fit=crop');
  readonly detectedSpecs = signal({
    furnitureType: 'Lounge Chair',
    style: 'Mid-Century Modern',
    material: 'Bouclé Fabric',
    woodType: 'Solid Walnut',
    color: 'Cream / Off-white',
    dimensions: '85W x 90D x 100H cm'
  });

  readonly recommendedAlternatives = computed<IProduct[]>(() => {
    return [
      this.productsDb().find(p => p.id === 105)!, // Minimal Lounge Chair
      {
        ...this.productsDb().find(p => p.id === 105)!,
        id: 1052,
        nameEn: 'Minimal Lounge Chair (Light Oak)',
        price: 850,
      },
      {
        ...this.productsDb().find(p => p.id === 105)!,
        id: 1053,
        nameEn: 'Minimal Lounge Chair (Dark Walnut)',
        price: 890,
      }
    ].filter(Boolean);
  });

  // Active items count and totals computation for Design Summary
  readonly roomProducts = computed<IProduct[]>(() => {
    return this.currentRoom().hotspots
      .map(hs => this.productsDb().find(p => p.id === hs.productId)!)
      .filter(Boolean);
  });

  readonly totalEstimate = computed(() => {
    return this.roomProducts().reduce((sum, p) => sum + p.price, 0);
  });

  // Actions
  selectHotspot(id: number): void {
    this.selectedHotspotId.set(id);
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
    this.selectedHotspotId.set(null);
  }

  // Update properties on mock state
  updateProductSpec(productId: number, field: 'color' | 'material' | 'woodType', value: string): void {
    if (field === 'color') {
      this.selectedColor.update(current => ({ ...current, [productId]: value }));
    } else if (field === 'material') {
      this.selectedMaterial.update(current => ({ ...current, [productId]: value }));
    } else if (field === 'woodType') {
      this.selectedWoodType.update(current => ({ ...current, [productId]: value }));
    }
  }

  replaceProductInHotspot(hotspotId: number, newProductId: number): void {
    this.rooms.update(currentRooms => {
      return currentRooms.map((room, idx) => {
        if (idx !== this.activeRoomIndex()) return room;
        return {
          ...room,
          hotspots: room.hotspots.map(hs => {
            if (hs.id !== hotspotId) return hs;
            return { ...hs, productId: newProductId };
          })
        };
      });
    });
  }

  addProductToCart(product: IProduct): void {
    void this.cartService.addToCart(product, 1);
  }

  addAllToCart(): void {
    const products = this.roomProducts();
    const promises = products.map(p => this.cartService.addToCart(p, 1));
    Promise.all(promises).then(() => {
      this.isSummaryOpen.set(false);
    });
  }

  // Simulate AI Chat interaction
  sendMessage(text: string): void {
    if (!text.trim()) return;

    // 1. Add User Message
    this.messages.update(current => [
      ...current,
      { sender: 'user', text, timestamp: new Date() }
    ]);

    // 2. Trigger typing state
    this.isTyping.set(true);

    // 3. Process reply after delay
    setTimeout(() => {
      this.isTyping.set(false);
      const cleaned = text.toLowerCase();
      let reply = "I've processed your request. Let me know if you would like to adjust the materials, layout, or color palette of any items in the design.";

      if (cleaned.includes('oak')) {
        // Swap all to Oak
        this.rooms().forEach((room, roomIdx) => {
          room.hotspots.forEach(hs => {
            if (hs.productId === 102) {
              this.updateProductSpec(102, 'woodType', 'Oak');
              this.updateProductSpec(102, 'color', 'Natural Oak');
            }
            if (hs.productId === 104) {
              this.updateProductSpec(104, 'woodType', 'Oak');
              this.updateProductSpec(104, 'color', 'Oak');
            }
          });
        });
        reply = "Updated successfully. I have swapped the tables and shelving to natural oak finishes.";
      } else if (cleaned.includes('sofa') && (cleaned.includes('color') || cleaned.includes('material'))) {
        // Change sofa color
        this.updateProductSpec(101, 'color', 'Forest Green');
        this.updateProductSpec(101, 'material', 'Velvet Fabric');
        reply = "I've updated the Nordic Lounge Sofa to Forest Green Velvet Fabric. You can see the updated details in the specification panel.";
      } else if (cleaned.includes('replace') && cleaned.includes('table')) {
        // Replace coffee table with glass table (107)
        const hs = this.currentRoom().hotspots.find(h => h.label === 'Coffee Table');
        if (hs) {
          this.replaceProductInHotspot(hs.id, 107);
        }
        reply = "I have swapped the Atelier Coffee Table with the sleek Glass Coffee Table as requested.";
      } else if (cleaned.includes('luxurious') || cleaned.includes('luxury')) {
        // Swap sofa to classic leather sofa
        const hsSofa = this.currentRoom().hotspots.find(h => h.label === 'Sofa');
        if (hsSofa) {
          this.replaceProductInHotspot(hsSofa.id, 106); // Roche Bobois Leather Sofa
        }
        reply = "I have updated the design to reflect a more luxurious modern style, substituting the fabric sofa for our Roche Bobois top-grain Leather Sofa in Cognac.";
      } else if (cleaned.includes('modern')) {
        // generic modern update
        reply = "I updated the layout with clean Scandinavian elements, streamlining the silhouettes and emphasizing walnut accents.";
      }

      this.messages.update(current => [
        ...current,
        { sender: 'ai', text: reply, timestamp: new Date() }
      ]);
    }, 1500);
  }
}
