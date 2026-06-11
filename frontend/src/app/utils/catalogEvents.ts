export const CATALOG_CHANGED_EVENT = 'aura:catalog-changed';
const DELETED_CATEGORY_KEY = 'aura-deleted-category';
const DELETED_PRODUCT_KEY = 'aura-deleted-product';

export type DeletedCategorySnapshot = {
  name: string;
  description: string;
  slug?: string;
  isActive?: boolean;
};

export type DeletedProductSnapshot = {
  name: string;
  description: string;
  categoryIds: string[];
  price: number;
  stock: number;
  serialNumber?: string;
  model?: string;
  distributor?: string;
  popularity?: number;
  discountRate?: number;
  discountActive?: boolean;
  imageUrl?: string;
  warrantyStatus?: boolean;
};

function readStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeStorage<T>(key: string, value: T | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / private-mode storage failures.
  }
}

export function notifyCatalogChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CATALOG_CHANGED_EVENT));
}

export function loadDeletedCategorySnapshot() {
  return readStorage<DeletedCategorySnapshot>(DELETED_CATEGORY_KEY);
}

export function saveDeletedCategorySnapshot(snapshot: DeletedCategorySnapshot | null) {
  writeStorage(DELETED_CATEGORY_KEY, snapshot);
}

export function loadDeletedProductSnapshot() {
  return readStorage<DeletedProductSnapshot>(DELETED_PRODUCT_KEY);
}

export function saveDeletedProductSnapshot(snapshot: DeletedProductSnapshot | null) {
  writeStorage(DELETED_PRODUCT_KEY, snapshot);
}
