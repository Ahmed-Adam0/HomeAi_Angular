import { IBackendOrder, IOrder, OrderStatus, IShippingAddress, IOrderItem } from '../interfaces';


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

  const items: IOrderItem[] = Array.isArray(order.items)
    ? order.items.map((item) => {
        const unitPrice = item.finalUnitPrice ?? item.unitPrice ?? 0;
        const totalItemPrice = item.totalItemPrice ?? (unitPrice * item.quantity);
        return {
          productId: Number(item.productId),
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: Number(unitPrice),
          total: Number(totalItemPrice),
          productImage: item.productImage ?? '',
          snapshotBasePrice: item.snapshotBasePrice,
          snapshotOptions: item.snapshotOptions,
          finalUnitPrice: item.finalUnitPrice,
          totalItemPrice: item.totalItemPrice,
          // Map localized attributes from API response
          attributes: item.attributes,
        };
      })
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
    updatedAt: order.updatedAt ?? null,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    placedAt: order.createdAt,
    estimatedDelivery: order.createdAt,
    subtotal: Number(order.totalPrice),
    total: Number(order.totalPrice),
    address: order.address ?? '',
    phoneNumber: order.phoneNumber ?? '',
    notes: order.notes ?? '',
    statusHistory: order.statusHistory ?? null,
    masterOrderId: order.masterOrderId,
    customerName: order.customerName ?? '',
    customerPhone: order.customerPhone ?? '',
    itemCount: order.itemCount ?? items.length,
  };

  console.log('Mapped order VM:', mapped);
  return mapped;
}

