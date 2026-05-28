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

  // Derive invoice totals
  const totalAmount = Number(b.totalPrice || 0);
  const shippingCost = b.shippingCost !== undefined ? Number(b.shippingCost) : 29; // standard shipping fallback
  
  // Calculate a mock 7.5% tax if tax is not provided (aligned with CartStore)
  const taxAmount = b.taxAmount !== undefined ? Number(b.taxAmount) : Number((totalAmount * 0.075).toFixed(2));
  const discountAmount = b.discountAmount !== undefined ? Number(b.discountAmount) : 0;

  // Shipping Address mapping with fallback values
  const shippingAddress: IShippingAddress = b.shippingAddress || {
    firstName: 'Valued',
    lastName: 'Customer',
    streetAddress: '123 Smart Home Avenue',
    city: 'Cairo',
    state: 'Cairo Governorate',
    zipCode: '11511',
    country: 'EG',
    phone: '+20 100 123 4567',
    apartment: 'Floor 3, Apt 12'
  };

  const billingAddress: IShippingAddress = b.billingAddress || shippingAddress;

  // Map backend items to frontend items, adding fallbacks for images and names
  const items = (b.items || []).map((item) => {
    const unitPrice = Number(item.unitPrice || 0);
    const quantity = Math.max(1, Math.round(Number(item.quantity) || 1));
    return {
      productId: String(item.productId || item.id || ''),
      productName: item.productName || `Premium Furniture #${item.productId}`,
      // Premium placeholder image for maximum visual wow factor in checkout & orders
      productImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=300&q=80',
      price: unitPrice,
      quantity: quantity,
      subtotal: Number((unitPrice * quantity).toFixed(2)),
      selectedColor: 'Standard',
      selectedMaterial: 'Oak Wood'
    };
  });

  // Calculate default tracking numbers & estimated delivery dates based on order creation
  const createdDate = new Date(b.createdAt || Date.now());
  const deliveryDate = new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 days delivery window

  return {
    id: String(b.id || ''),
    orderNumber: `ORD-${String(b.id || '').padStart(6, '0')}`,
    userId: b.userId || '',
    items,
    status,
    shippingAddress,
    billingAddress,
    shippingCost,
    taxAmount,
    discountAmount,
    totalAmount,
    paymentMethod: b.paymentMethod || 'Stripe Credit Card',
    paymentStatus: b.paymentStatus || (status === 'cancelled' ? 'failed' : status === 'pending' ? 'pending' : 'paid'),
    trackingNumber: b.trackingNumber || `TRK-${b.id || ''}${Math.floor(100000 + Math.random() * 900000)}`,
    carrier: b.carrier || 'Aramex Express',
    createdAt: b.createdAt || new Date().toISOString(),
    updatedAt: b.updatedAt || b.createdAt || new Date().toISOString(),
    estimatedDeliveryDate: b.estimatedDeliveryDate || deliveryDate.toISOString()
  };
}
