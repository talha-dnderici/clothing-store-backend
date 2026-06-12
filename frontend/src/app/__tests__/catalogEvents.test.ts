/**
 * FE — Unit tests: catalog change events and recovery snapshots.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CATALOG_CHANGED_EVENT,
  notifyCatalogChanged,
  saveDeletedCategorySnapshot,
  loadDeletedCategorySnapshot,
  saveDeletedProductSnapshot,
  loadDeletedProductSnapshot,
} from '../utils/catalogEvents';

describe('catalogEvents', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('dispatches aura:catalog-changed when notifyCatalogChanged is called', () => {
    const handler = vi.fn();
    window.addEventListener(CATALOG_CHANGED_EVENT, handler);

    notifyCatalogChanged();

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(CATALOG_CHANGED_EVENT, handler);
  });

  it('saves, loads, and clears a deleted category snapshot', () => {
    const snapshot = {
      name: 'Demo Collection',
      description: 'Category created during the demo.',
    };

    saveDeletedCategorySnapshot(snapshot);
    expect(loadDeletedCategorySnapshot()).toEqual(snapshot);

    saveDeletedCategorySnapshot(null);
    expect(loadDeletedCategorySnapshot()).toBeNull();
  });

  it('saves, loads, and clears a deleted product snapshot', () => {
    const snapshot = {
      name: 'Oversized Hoodie',
      description: 'Premium cotton blend hoodie.',
      categoryIds: ['cat-hoodies', 'cat-men'],
      price: 79.99,
      stock: 30,
      serialNumber: 'SN-001',
      model: 'AH-2026',
      discountRate: 10,
      discountActive: false,
    };

    saveDeletedProductSnapshot(snapshot);
    expect(loadDeletedProductSnapshot()).toEqual(snapshot);

    saveDeletedProductSnapshot(null);
    expect(loadDeletedProductSnapshot()).toBeNull();
  });
});
