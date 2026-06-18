import { environment } from '../../../environments/environment';

export type ApiEnvelope<T> = T | { data: T } | { result: T } | { items: T } | { value: T };

/**
 * Robustly and recursively unwraps standard backend API wrapper layers.
 */
export function unwrap<T>(value: any): T {
  if (value && typeof value === 'object') {
    const keys = ['data', 'result', 'items', 'value'];
    for (const key of keys) {
      if (key in value) {
        return unwrap(value[key]);
      }
    }
  }
  return value as T;
}

/**
 * Converts a relative image path into a safe, absolute encoded URL.
 * Safely resolves the API origin dynamically from the environment configuration.
 */
export function formatImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  url = url.trim();

  // Deduplicate protocol prepended URLs, e.g. "http://localhost:5000/http://localhost:5000/..."
  if (url.includes('http://') || url.includes('https://')) {
    const lastHttp = url.lastIndexOf('http://');
    const lastHttps = url.lastIndexOf('https://');
    const lastIdx = Math.max(lastHttp, lastHttps);
    if (lastIdx > 0) {
      url = url.substring(lastIdx);
    }
  }

  const origin = environment.apiUrl.replace(/\/api\/?$/, '');

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsedOrigin = new URL(origin);
      const host = parsedOrigin.host;
      const protocol = parsedOrigin.protocol;

      const hostPrefix = `${protocol}//${host}/${host}/`;
      if (url.startsWith(hostPrefix)) {
        url = url.replace(hostPrefix, `${protocol}//${host}/`);
      } else {
        const genericPrefix1 = `http://${host}/${host}/`;
        const genericPrefix2 = `https://${host}/${host}/`;
        if (url.startsWith(genericPrefix1)) {
          url = url.replace(genericPrefix1, `http://${host}/`);
        } else if (url.startsWith(genericPrefix2)) {
          url = url.replace(genericPrefix2, `https://${host}/`);
        }
      }
    } catch (e) {}

    return encodeURI(url);
  }

  // Handle leading slashes or relative paths without origin duplication
  try {
    const parsedOrigin = new URL(origin);
    const host = parsedOrigin.host;
    if (url.startsWith(host + '/')) {
      url = url.substring(host.length + 1);
    } else if (url.startsWith('/' + host + '/')) {
      url = url.substring(host.length + 2);
    }
  } catch (e) {}

  const cleanUrl = url.replace(/^\/+/, '');
  const fullUrl = `${origin}/${cleanUrl}`;

  return encodeURI(fullUrl);
}

// Helper to check if a value is a valid image URL string
function isImageUrlString(val: any): boolean {
  if (typeof val !== 'string') return false;
  const s = val.toLowerCase().trim();
  return s.startsWith('http://') ||
         s.startsWith('https://') ||
         s.startsWith('/') ||
         s.includes('.') ||
         s.startsWith('data:image/');
}

// Helper to extract image URL from an object
function extractImageUrlFromObj(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;

  const keys = [
    'imageUrl', 'url', 'imagePath', 'path', 'src', 'fileUrl', 'attachmentUrl',
    'mediaUrl', 'mainImageUrl', 'coverImageUrl', 'image', 'mainImage'
  ];
  for (const k of keys) {
    if (obj[k] && typeof obj[k] === 'string' && isImageUrlString(obj[k])) {
      return obj[k];
    }
  }

  for (const k in obj) {
    if (obj[k] && typeof obj[k] === 'object') {
      const nested = extractImageUrlFromObj(obj[k]);
      if (nested) return nested;
    }
  }

  return null;
}

// Helper to extract nested images from an arbitrary field/collection
function extractImagesFromField(val: any): string[] {
  const urls: string[] = [];
  if (!val) return urls;

  if (Array.isArray(val)) {
    for (const item of val) {
      if (typeof item === 'string' && isImageUrlString(item)) {
        urls.push(item);
      } else if (item && typeof item === 'object') {
        const u = extractImageUrlFromObj(item);
        if (u) urls.push(u);
      }
    }
  } else if (typeof val === 'object') {
    const u = extractImageUrlFromObj(val);
    if (u) urls.push(u);
  }
  return urls;
}

/**
 * Normalizes backend product data structures to guarantee consistent frontend models.
 * Implements strict multi-tier fallback logic to resolve storefront image consistently.
 */
export function normalizeProduct(prod: any): any {
  if (!prod) return prod;

  const productId = prod.id || prod.productId || 'unknown';
  let resolvedUrl = '';
  let resolverTier = '';

  // Standardize the images array
  let images = prod.images;
  if (images && Array.isArray(images)) {
    images = images.map((img: any) => {
      if (typeof img === 'string') {
        return {
          imageUrl: formatImageUrl(img),
          isPrimary: false
        };
      }
      if (img && typeof img === 'object') {
        return {
          ...img,
          imageUrl: formatImageUrl(img.imageUrl || img.url || img.imagePath),
          isPrimary: !!(img.isPrimary || img.primary)
        };
      }
      return img;
    });
  } else {
    images = [];
  }

  // Tier 1: Direct cover / main fields
  const tier1Candidates = [prod.mainImageUrl, prod.coverImageUrl, prod.imageUrl, prod.image, prod.mainImage];
  const tier1Val = tier1Candidates.find(val => val && typeof val === 'string' && val.trim());
  if (tier1Val) {
    resolvedUrl = formatImageUrl(tier1Val);
    resolverTier = 'Tier 1 (Direct Fields)';
  }

  // Tier 2: Primary Image Object
  if (!resolvedUrl && prod.primaryImage) {
    let pImg = '';
    if (typeof prod.primaryImage === 'string') {
      pImg = prod.primaryImage;
    } else if (typeof prod.primaryImage === 'object') {
      pImg = extractImageUrlFromObj(prod.primaryImage) || '';
    }
    if (pImg && pImg.trim()) {
      resolvedUrl = formatImageUrl(pImg);
      resolverTier = 'Tier 2 (Primary Image Object)';
    }
  }

  // Tier 3: Gallery Primary
  if (!resolvedUrl && images.length > 0) {
    const primaryImg = images.find((x: any) => x && x.isPrimary);
    if (primaryImg && primaryImg.imageUrl && primaryImg.imageUrl.trim()) {
      resolvedUrl = primaryImg.imageUrl;
      resolverTier = 'Tier 3 (Gallery Primary)';
    }
  }

  // Tier 4: Gallery First
  if (!resolvedUrl && images.length > 0) {
    const firstImg = images[0];
    if (firstImg && firstImg.imageUrl && firstImg.imageUrl.trim()) {
      resolvedUrl = firstImg.imageUrl;
      resolverTier = 'Tier 4 (Gallery First)';
    }
  }

  // Tier 5: Extended Collections (attachments, media, variant images, gallery collections, nested arrays)
  if (!resolvedUrl) {
    const fieldsToInspect = [
      prod.attachments,
      prod.media,
      prod.variants,
      prod.variantImages,
      prod.variant_images,
      prod.productVariants,
      prod.gallery,
      prod.galleryCollections,
      prod.collections
    ];

    // Find any arrays on prod we haven't already explicitly checked
    for (const key in prod) {
      if (prod[key] && Array.isArray(prod[key]) && !['images', 'attachments', 'media', 'variants', 'variantImages', 'variant_images', 'productVariants', 'gallery', 'galleryCollections', 'collections'].includes(key)) {
        fieldsToInspect.push(prod[key]);
      }
    }

    let foundExtraUrl = '';
    for (const field of fieldsToInspect) {
      const extraUrls = extractImagesFromField(field);
      if (extraUrls.length > 0) {
        foundExtraUrl = extraUrls[0];
        break;
      }
    }

    if (foundExtraUrl && foundExtraUrl.trim()) {
      resolvedUrl = formatImageUrl(foundExtraUrl);
      resolverTier = 'Tier 5 (Extended Collections)';
    }
  }

  // Tier 6: Thumbnail
  if (!resolvedUrl) {
    const thumbCandidates = [prod.thumbnail, prod.thumbnailUrl, prod.thumb];
    const thumbVal = thumbCandidates.find(val => val && typeof val === 'string' && val.trim());
    if (thumbVal) {
      resolvedUrl = formatImageUrl(thumbVal);
      resolverTier = 'Tier 6 (Thumbnail)';
    }
  }

  // Tier 7: Default Placeholder
  if (!resolvedUrl) {
    resolvedUrl = 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=800&q=80';
    resolverTier = 'Tier 7 (Default Placeholder)';
  }

  // Temporary resolver debug logs as per User Request Safeguard #2
  console.log('Favorite image resolved', {
    productId,
    resolverTier,
    resolvedUrl
  });

  // Cast isActive explicitly to boolean
  const isActive = prod.isActive === undefined || prod.isActive === null
    ? true
    : (prod.isActive === true || prod.isActive === 1 || prod.isActive === 'true');

  const basePrice = prod.basePrice ?? prod.price ?? 0;
  const name = prod.name || prod.nameEn || prod.nameAr || '';
  const description = prod.description || prod.descriptionEn || prod.descriptionAr || '';

  let materials = prod.materials;
  if (prod.materialGroups && Array.isArray(prod.materialGroups)) {
    materials = prod.materialGroups.map((group: any) => ({
      materialId: group.id,
      name: group.nameEn || group.nameAr || '',
      nameAr: group.nameAr || '',
      nameEn: group.nameEn || '',
      options: (group.options || []).map((opt: any) => ({
        id: opt.id,
        name: opt.valueEn || opt.valueAr || '',
        valueAr: opt.valueAr || '',
        valueEn: opt.valueEn || '',
        priceDelta: Number(opt.priceOption !== undefined ? opt.priceOption : (opt.priceDelta || 0))
      }))
    }));
  } else if (prod.attributes && Array.isArray(prod.attributes)) {
    materials = prod.attributes.map((attr: any) => ({
      materialId: attr.id,
      name: attr.nameEn || attr.nameAr || '',
      nameAr: attr.nameAr || '',
      nameEn: attr.nameEn || '',
      options: (attr.values || []).map((val: any) => ({
        id: val.id,
        name: val.valueEn || val.valueAr || '',
        valueAr: val.valueAr || '',
        valueEn: val.valueEn || '',
        priceDelta: Number(val.priceDelta || 0)
      }))
    }));
  }

  let vendorMaterialOptionIds = prod.vendorMaterialOptionIds;
  if (!vendorMaterialOptionIds) {
    vendorMaterialOptionIds = [];
    if (prod.materialOptions && Array.isArray(prod.materialOptions)) {
      vendorMaterialOptionIds = prod.materialOptions.map((mo: any) => mo.vendorMaterialOptionId);
    } else if (prod.materialGroups && Array.isArray(prod.materialGroups)) {
      for (const group of prod.materialGroups) {
        if (group.options) {
          for (const opt of group.options) {
            vendorMaterialOptionIds.push(opt.id);
          }
        }
      }
    } else if (prod.attributes && Array.isArray(prod.attributes)) {
      for (const attr of prod.attributes) {
        if (attr.values) {
          for (const val of attr.values) {
            vendorMaterialOptionIds.push(val.id);
          }
        }
      }
    } else if (materials && Array.isArray(materials)) {
      for (const mat of materials) {
        if (mat.options) {
          for (const opt of mat.options) {
            vendorMaterialOptionIds.push(opt.id);
          }
        }
      }
    }
  }

  return {
    ...prod,
    price: basePrice,
    basePrice: basePrice,
    nameEn: prod.nameEn || name,
    nameAr: prod.nameAr || name,
    descriptionEn: prod.descriptionEn || description,
    descriptionAr: prod.descriptionAr || description,
    mainImageUrl: resolvedUrl,
    images,
    isActive,
    materials,
    vendorMaterialOptionIds
  };
}
