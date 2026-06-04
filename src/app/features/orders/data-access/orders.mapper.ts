import { IBackendOrder, IOrder, OrderStatus, IShippingAddress } from '../interfaces';

/**
 * Maps a raw backend order (IBackendOrder) to the frontend IOrder model.
 * This mapper assumes the backend already returns a single order object.
 */
export function mapBackendToOrder(order: IBackendOrder): IOrder {
  if (!order || Array.isArray(order)) {
    throw new Error('Expected a single backend order object');
  }

  console.log('Backend order response inside mapper:', order);

  const rawStatus = (order.status ?? '').toLowerCase();
  const status: OrderStatus =
    rawStatus === 'processing'
      ? 'processing'
      : rawStatus === 'shipped'
      ? 'shipped'
      : rawStatus === 'delivered'
      ? 'delivered'
      : rawStatus === 'cancelled'
      ? 'cancelled'
      : rawStatus === 'refunded'
      ? 'refunded'
      : 'pending';

  const shippingAddress: IShippingAddress = order.shippingAddress ?? {
    firstName: '',
    lastName: '',
    streetAddress: order.address ?? '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: order.phoneNumber ?? '',
    apartment: '',
  };

  const billingAddress: IShippingAddress = order.billingAddress ?? shippingAddress;

  const items = Array.isArray(order.items)
    ? order.items.map((item) => ({
        id: item.id,
        productId: String(item.productId),
        productName: item.productName,
        quantity: item.quantity,
        price: Number(item.unitPrice),
        subtotal: Number(item.unitPrice) * item.quantity,
        productImage: item.productImage ?? '',
      }))
    : [];

  const paymentStatus = order.paymentStatus ?? (status === 'delivered' ? 'paid' : 'pending');

  const mapped: IOrder = {
    id: String(order.id),
    orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
    userId: order.userId,
    items,
    status,
    shippingAddress,
    billingAddress,
    shippingCost: order.shippingCost ?? 0,
    taxAmount: order.taxAmount ?? 0,
    discountAmount: order.discountAmount ?? 0,
    totalAmount: Number(order.totalPrice),
    paymentMethod: order.paymentMethod ?? 'Cash on Delivery',
    paymentStatus,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt ?? order.createdAt,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    placedAt: order.createdAt,
    estimatedDelivery: order.createdAt,
    subtotal: Number(order.totalPrice),
    total: Number(order.totalPrice),
    address: order.address ?? '',
    phoneNumber: order.phoneNumber ?? '',
    notes: order.notes ?? null,
    statusHistory: order.statusHistory ?? [],
  };

  console.log('Mapped order VM:', mapped);
  return mapped;
}
