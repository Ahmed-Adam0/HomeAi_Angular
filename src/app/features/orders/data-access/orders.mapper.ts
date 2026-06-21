import { IBackendOrder, IOrder, OrderStatus, IShippingAddress, IOrderItem, ICustomerVendorOrder } from '../interfaces';


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
    rawStatus === 'awaitingcustomerapproval' || rawStatus === 'awaiting_customer_approval'
      ? 'awaiting_customer_approval'
      : rawStatus === 'confirmed'
      ? 'confirmed'
      : rawStatus === 'inprogress' || rawStatus === 'processing' || rawStatus === 'in progress'
      ? 'processing'
      : rawStatus === 'readyforpickup' || rawStatus === 'ready' || rawStatus === 'shipped' || rawStatus === 'ready for pickup'
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

        const voRawStatus = (vo.status ?? '').toLowerCase();
        const voStatus: OrderStatus =
          voRawStatus === 'awaitingcustomerapproval' || voRawStatus === 'awaiting_customer_approval'
            ? 'awaiting_customer_approval'
            : voRawStatus === 'confirmed'
            ? 'confirmed'
            : voRawStatus === 'inprogress' || voRawStatus === 'processing' || voRawStatus === 'in progress'
            ? 'processing'
            : voRawStatus === 'readyforpickup' || voRawStatus === 'ready' || voRawStatus === 'shipped' || voRawStatus === 'ready for pickup'
            ? 'shipped'
            : voRawStatus === 'delivered'
            ? 'delivered'
            : voRawStatus === 'cancelled'
            ? 'cancelled'
            : voRawStatus === 'refunded'
            ? 'refunded'
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
    vendorOrders,
  };

  console.log('Mapped order VM:', mapped);
  return mapped;
}

