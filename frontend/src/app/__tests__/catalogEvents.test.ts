/**
 * FE — Unit tests: catalog change events and recovery snapshots.
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
});
