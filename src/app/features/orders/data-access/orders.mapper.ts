import { IBackendOrder, IOrder, OrderStatus, IShippingAddress, IOrderItem, ICustomerVendorOrder } from '../interfaces';


function normalizeRawStatus(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s_-]+/g, '_')
    .toLowerCase();
}

/**
 * Maps a raw backend order (IBackendOrder) to the frontend IOrder model.
 * This mapper assumes the backend already returns a single order object.
 */
export function mapBackendToOrder(order: IBackendOrder): IOrder {
  if (!order || Array.isArray(order)) {
    throw new Error('Expected a single backend order object');
  }

  console.log('Backend order response inside mapper:', order);

  const rawStatus = normalizeRawStatus(order.status);
  const status: OrderStatus =
    rawStatus === 'awaiting_customer_approval'
      ? 'awaiting_customer_approval'
    : rawStatus === 'pending_payment'
      ? 'pending_payment'
    : rawStatus === 'confirmed'
      ? 'confirmed'
    : rawStatus === 'in_progress' || rawStatus === 'processing'
      ? 'in_progress'
    : rawStatus === 'ready'
      ? 'ready'
    : rawStatus === 'shipped'
      ? 'shipped'
    : rawStatus === 'delivered'
      ? 'delivered'
    : rawStatus === 'cancelled'
      ? 'cancelled'
    : rawStatus === 'refunded'
      ? 'refunded'
    : rawStatus === 'returned'
      ? 'returned'
    : rawStatus === 'completed'
      ? 'completed'
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

  const vendorOrders: ICustomerVendorOrder[] = Array.isArray(order.vendorOrders)
    ? order.vendorOrders.map((vo) => {
        const voItems: IOrderItem[] = Array.isArray(vo.items)
          ? vo.items.map((item) => {
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
                attributes: item.attributes,
              };
            })
          : [];

        const voRawStatus = normalizeRawStatus(vo.status);
        const voStatus: OrderStatus =
          voRawStatus === 'awaiting_customer_approval'
            ? 'awaiting_customer_approval'
          : voRawStatus === 'pending_payment'
            ? 'pending_payment'
          : voRawStatus === 'confirmed'
            ? 'confirmed'
          : voRawStatus === 'in_progress' || voRawStatus === 'processing'
            ? 'in_progress'
          : voRawStatus === 'ready'
            ? 'ready'
          : voRawStatus === 'shipped'
            ? 'shipped'
          : voRawStatus === 'delivered'
            ? 'delivered'
          : voRawStatus === 'cancelled'
            ? 'cancelled'
          : voRawStatus === 'refunded'
            ? 'refunded'
          : voRawStatus === 'returned'
            ? 'returned'
          : voRawStatus === 'completed'
            ? 'completed'
          : 'pending';

        return {
          id: String(vo.id),
          status: voStatus,
          estimatedDeliveryDate: vo.estimatedDeliveryDate,
          canApprove: vo.canApprove,
          totalPrice: Number(vo.totalPrice),
          items: voItems,
        };
      })
    : [];

  const paymentMethod = order.paymentMethod ?? 'Paymob';
  const isCOD = paymentMethod === 'COD' || paymentMethod === 'Cash on Delivery' || paymentMethod.toLowerCase().includes('cash');

  let finalStatus = status;
  const isPaid = paymentStatus === 'paid';
  const isPostApproval = status === 'pending_payment' || status === 'confirmed' || status === 'in_progress';
  
  if (isPostApproval && !isPaid && !isCOD) {
    finalStatus = 'pending_payment';
  }

  const mapped: IOrder = {
    id: String(order.id),
    orderNumber: `ORD-${String(order.id).padStart(6, '0')}`,
    userId: order.userId,
    items,
    status: finalStatus,
    shippingAddress,
    billingAddress,
    shippingCost: order.shippingCost ?? 0,
    taxAmount: order.taxAmount ?? 0,
    discountAmount: order.discountAmount ?? 0,
    totalAmount: Number(order.totalPrice),
    paymentMethod: order.paymentMethod ?? 'Paymob',
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
    firstName: order.firstName ?? '',
    lastName: order.lastName ?? '',
    email: order.email ?? '',
    itemCount: order.itemCount ?? items.length,
    vendorOrders,
  };

  console.log('Mapped order VM:', mapped);
  return mapped;
}

