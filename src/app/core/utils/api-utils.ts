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
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return encodeURI(url);
  }
  
  // Safe extraction of origin from environment.apiUrl (stripping the trailing /api/ suffix)
  const origin = environment.apiUrl.replace(/\/api\/?$/, '');
  
  let fullUrl = '';
  if (url.startsWith('/')) {
    fullUrl = `${origin}${url}`;
  } else {
    fullUrl = `${origin}/${url}`;
  }
  
  return encodeURI(fullUrl);
}

/**
 * Normalizes backend product data structures to guarantee consistent frontend models.
 * Implements fallback logic to resolve mainImageUrl from images array if missing.
 */
export function normalizeProduct(prod: any): any {
  if (!prod) return prod;
  
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

  // Retrieve or fallback the main image URL
  let mainImageUrl = prod.mainImageUrl || prod.coverImageUrl || prod.imageUrl;
  if (!mainImageUrl && prod.primaryImage) {
    if (typeof prod.primaryImage === 'string') {
      mainImageUrl = prod.primaryImage;
    } else if (typeof prod.primaryImage === 'object' && prod.primaryImage.imageUrl) {
      mainImageUrl = prod.primaryImage.imageUrl;
    }
  }

  // Fallback image resolution logic (Requirement 10)
  if (!mainImageUrl) {
    const primaryImg = images.find((x: any) => x && x.isPrimary);
    if (primaryImg && primaryImg.imageUrl) {
      mainImageUrl = primaryImg.imageUrl;
    } else if (images[0]) {
      if (typeof images[0] === 'string') {
        mainImageUrl = images[0];
      } else if (images[0] && images[0].imageUrl) {
        mainImageUrl = images[0].imageUrl;
      }
    }
  }

  // Format the resolved main image URL
  mainImageUrl = formatImageUrl(mainImageUrl);

  // Cast isActive explicitly to boolean (handles falsy/undefined/numbers/strings)
  const isActive = prod.isActive === undefined || prod.isActive === null
    ? true
    : (prod.isActive === true || prod.isActive === 1 || prod.isActive === 'true');

  console.log('Product isActive raw value:', prod.isActive, typeof prod.isActive);

  return {
    ...prod,
    mainImageUrl,
    images,
    isActive
  };
}
