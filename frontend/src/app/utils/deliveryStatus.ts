export type DeliveryStatus = 'processing' | 'in-transit' | 'delivered' | 'cancelled';

export function nextDeliveryStatus(status: DeliveryStatus): DeliveryStatus | null {
  if (status === 'processing') return 'in-transit';
  if (status === 'in-transit') return 'delivered';
  return null;
}
