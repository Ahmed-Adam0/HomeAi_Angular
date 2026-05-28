import { IOrder, IBackendOrder, OrderStatus, IShippingAddress } from '../interfaces';

/**
 * Maps a raw backend order (IBackendOrder) to the frontend IOrder model.
 * Provides sensible defaults for fields not returned by the API so that the
 * premium UI components render correctly without breaking.
 */
export function mapBackendToOrder(b: IBackendOrder): IOrder {
  if (!b) {
    throw new Error('Backend order is null or undefined');
  }

  console.log('Backend order response inside mapper:', b);

  // Map case-insensitive backend status to frontend OrderStatus type
  const rawStatus = (b.status || 'Pending').toLowerCase();
  let status: OrderStatus = 'pending';
  if (rawStatus === 'processing') {
    status = 'processing';
  } else if (rawStatus === 'shipped') {
    status = 'shipped';
  } else if (rawStatus === 'delivered') {
    status = 'delivered';
  } else if (rawStatus === 'cancelled') {
    status = 'cancelled';
  } else if (rawStatus === 'refunded') {
    status = 'refunded';
  }

  // Derive dates
  const createdDate = new Date(b.createdAt || Date.now());
  const deliveryDate = new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days delivery window

  // Shipping Address mapping with backend fields and fallbacks
  const shippingAddress: IShippingAddress = (b.shippingAddress && typeof b.shippingAddress === 'object')
    ? {
        firstName: b.shippingAddress.firstName || 'Valued',
        lastName: b.shippingAddress.lastName || 'Customer',
        streetAddress: b.shippingAddress.streetAddress || b.address || '123 Smart Home Avenue',
        city: b.shippingAddress.city || 'Cairo',
        state: b.shippingAddress.state || 'Cairo Governorate',
        zipCode: b.shippingAddress.zipCode || '11511',
        country: b.shippingAddress.country || 'EG',
        phone: b.shippingAddress.phone || b.phoneNumber || '+20 100 123 4567',
        apartment: b.shippingAddress.apartment || ''
      }
    : {
        firstName: 'Valued',
        lastName: 'Customer',
        streetAddress: b.address || '123 Smart Home Avenue',
        city: 'Cairo',
        state: 'Cairo Governorate',
        zipCode: '11511',
        country: 'EG',
        phone: b.phoneNumber || '+20 100 123 4567',
        apartment: 'Floor 3, Apt 12'
      };

  const billingAddress: IShippingAddress = b.billingAddress || shippingAddress;

  // Map items properly
  const items = (b.items || []).map((item) => {
    const unitPrice = Number(item.unitPrice || 0);
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    const total = unitPrice * quantity;
    const image = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85';
    const name = item.productName || `Product ${item.productId}`;
    return {
      id: item.id,
      productId: String(item.productId || item.id || ''),
      productName: name,
      productImage: image,
      price: unitPrice,
      quantity: quantity,
      subtotal: total,
      selectedColor: 'Standard',
      selectedMaterial: 'Oak Wood',
      // Compatibility fields
      name: name,
      total: total,
      image: image
    };
  });

  const subtotalVal = b.totalPrice ?? 0;
  const totalVal = b.totalPrice ?? 0;

  const mapped: IOrder = {
    id: String(b.id || ''),
    orderNumber: `ORD-${String(b.id || '').padStart(6, '0')}`,
    userId: b.userId || '',
    items,
    status,
    shippingAddress,
    billingAddress,
    shippingCost: 0,
    taxAmount: 0,
    discountAmount: b.discountAmount !== undefined ? Number(b.discountAmount) : 0,
    totalAmount: totalVal,
    paymentMethod: b.paymentMethod || 'Cash on Delivery',
    paymentStatus: (b.status === 'Delivered' ? 'paid' : 'pending') as any,
    trackingNumber: b.trackingNumber || `TRK-${100000 + b.id}`,
    carrier: b.carrier || 'Aramex Express',
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
    estimatedDeliveryDate: b.estimatedDeliveryDate || deliveryDate.toISOString(),
    // Compatibility fields
    placedAt: b.createdAt,
    estimatedDelivery: deliveryDate.toISOString(),
    subtotal: subtotalVal,
    total: totalVal,
    address: b.address || 'N/A',
    phoneNumber: b.phoneNumber || 'N/A'
  };

  console.log('Mapped order VM:', mapped);
  return mapped;
}
