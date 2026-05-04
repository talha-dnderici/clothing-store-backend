import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import Home from '../pages/Home';
import { api } from '../utils/api';

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useOutletContext: () => ({ searchQuery: '', activeCategory: 'All' }),
  };
});

vi.mock('../utils/api', () => ({
  api: {
    getProducts: vi.fn(),
  }
}));

vi.mock('../utils/mapProduct', () => ({
  mapProducts: (items: any[]) => items,
}));

vi.mock('../context/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    totalItems: 0,
  }),
}));

// We need to mock components that rely on icons or contexts that we aren't completely providing here
vi.mock('../components/CartDrawer', () => ({ CartDrawer: () => <div data-testid="cart-drawer" /> }));
vi.mock('../components/HeroBanner', () => ({ HeroBanner: () => <div data-testid="hero-banner" /> }));
vi.mock('../components/PopularProducts', () => ({ PopularProducts: () => <div data-testid="popular-products" /> }));
vi.mock('../components/FilterSection', () => ({ FilterSection: ({count}: any) => <div data-testid="filter-section">({count} items)</div> }));
vi.mock('../components/ProductGrid', () => ({ ProductGrid: ({products}: any) => <div data-testid="product-grid">{products.map((p: any) => p.name).join(', ')}</div> }));

describe('Home Product Listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter section and default empty products state', async () => {
    (api.getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        items: []
      }
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    // Assert Filter Section renders
    expect(screen.getByTestId('filter-section')).toBeInTheDocument();
    
    await waitFor(() => {
      // 0 items text should appear from FilterSection
      expect(screen.getByText('(0 items)')).toBeInTheDocument();
    });
  });

  it('displays products fetched from API', async () => {
    const mockProducts = [
      { id: '1', name: 'Cool Shirt', price: 29.99, imageUrl: '', rating: 4, category: 'Shirts', discountActive: false },
      { id: '2', name: 'Nice Pants', price: 49.99, imageUrl: '', rating: 5, category: 'Pants', discountActive: false }
    ];

    (api.getProducts as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        items: mockProducts
      }
    });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Cool Shirt/)).toBeInTheDocument();
      expect(screen.getByText(/Nice Pants/)).toBeInTheDocument();
      expect(screen.getByText(/\(2 items\)/)).toBeInTheDocument();
    });
  });

  it('shows error state when API request fails', async () => {
    (api.getProducts as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Products could not be loaded from the database.')).toBeInTheDocument();
    });
  });
});
