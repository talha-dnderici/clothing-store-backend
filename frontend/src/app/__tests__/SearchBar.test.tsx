import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar UX Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders correctly', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('updates input value on change', () => {
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 't-shirt' } });
    expect(input).toHaveValue('t-shirt');
  });

  it('calls onSearch callback after debounce delay', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 'jeans' } });

    // Ensure it hasn't been called BEFORE the delay
    expect(mockOnSearch).not.toHaveBeenCalledWith('jeans');

    // advance the 300ms debounce
    vi.advanceTimersByTime(300);

    expect(mockOnSearch).toHaveBeenCalledWith('jeans');
  });

  it('clears the input and fires onSearch with empty string when clear button is clicked', () => {
    const mockOnSearch = vi.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText('Search products...');
    fireEvent.change(input, { target: { value: 'hoodie' } });

    // The clear button (with 'lucide-react' X icon) surfaces unconditionally if query is present, 
    // it's rendered as a button. 
    // We can get it by its button role inside the component's div.
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});
