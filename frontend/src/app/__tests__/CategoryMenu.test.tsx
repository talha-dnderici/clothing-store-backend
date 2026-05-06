import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CategoryMenu } from '../components/CategoryMenu';

describe('CategoryMenu Component', () => {
  const defaultProps = {
    activeCategory: 'All',
    categories: ['All', 'Men', 'Women', 'Unisex', 'Hoodies', 'Jeans'],
    onCategoryChange: vi.fn(),
  };

  it('renders correctly with gender and type categories separated', () => {
    render(<CategoryMenu {...defaultProps} />);
    
    // Genders
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Men')).toBeInTheDocument();
    expect(screen.getByText('Women')).toBeInTheDocument();
    expect(screen.getByText('Unisex')).toBeInTheDocument();
    
    // Types
    expect(screen.getByText('Hoodies')).toBeInTheDocument();
    expect(screen.getByText('Jeans')).toBeInTheDocument();
  });

  it('calls onCategoryChange when a gender category is clicked', () => {
    render(<CategoryMenu {...defaultProps} />);
    
    const womenBtn = screen.getByText('Women');
    fireEvent.click(womenBtn);
    
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('Women');
  });

  it('calls onCategoryChange when a type category is clicked', () => {
    render(<CategoryMenu {...defaultProps} />);
    
    const hoodiesBtn = screen.getByText('Hoodies');
    fireEvent.click(hoodiesBtn);
    
    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith('Hoodies');
  });

  it('highlights the active category correctly', () => {
    render(<CategoryMenu {...defaultProps} activeCategory="Jeans" />);
    
    const activeBtn = screen.getByText('Jeans');
    // plainClass for types uses bg-gray-100 when active
    expect(activeBtn).toHaveClass('bg-gray-100', 'text-black', 'shadow-sm');
    
    const inactiveBtn = screen.getByText('Men');
    // pillClass for genders uses text-gray-600 when inactive
    expect(inactiveBtn).toHaveClass('text-gray-600');
  });
});
