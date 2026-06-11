/**
 * FE — Unit tests: delivery status transitions for the manager panel.
 */
import { describe, it, expect } from 'vitest';
import { nextDeliveryStatus } from '../utils/deliveryStatus';

describe('deliveryStatus', () => {
  it('advances processing deliveries to in-transit', () => {
    expect(nextDeliveryStatus('processing')).toBe('in-transit');
  });

  it('advances in-transit deliveries to delivered', () => {
    expect(nextDeliveryStatus('in-transit')).toBe('delivered');
  });

  it('does not advance delivered or cancelled deliveries', () => {
    expect(nextDeliveryStatus('delivered')).toBeNull();
    expect(nextDeliveryStatus('cancelled')).toBeNull();
  });
});
