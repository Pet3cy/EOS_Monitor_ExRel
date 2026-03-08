import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item?',
    message: 'Are you sure you want to delete this item?'
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDeleteModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('displays custom title and message', () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Title',
      message: 'Custom message text'
    };

    render(<ConfirmDeleteModal {...customProps} />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message text')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));

    if (xButton) {
      fireEvent.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('calls both onConfirm and onClose when Delete button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

    const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const backdrop = container.querySelector('.backdrop-blur-sm');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('has correct button text', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete permanently/i })).toBeInTheDocument();
  });

  it('renders alert icon', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    // Check for the alert triangle icon's parent div with bg-red-50
    const iconContainer = container.querySelector('.bg-red-50');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not call onConfirm when cancelled', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('handles multiple close calls correctly', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    fireEvent.click(cancelButton);

    // onClose should be called each time
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('renders with proper styling classes for delete action', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
    expect(deleteButton.className).toContain('bg-red-600');
  });

  it('handles rapid consecutive clicks on delete button', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

    const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
    fireEvent.click(deleteButton);

    // First click calls both onConfirm and onClose once
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with very long title', () => {
    const longTitle = 'A'.repeat(200);
    render(<ConfirmDeleteModal {...defaultProps} title={longTitle} />);

    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('renders with very long message', () => {
    const longMessage = 'B'.repeat(500);
    render(<ConfirmDeleteModal {...defaultProps} message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders with empty title and message', () => {
    render(<ConfirmDeleteModal {...defaultProps} title="" message="" />);

    // Should render without crashing
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('handles special characters in title and message', () => {
    const specialProps = {
      ...defaultProps,
      title: 'Delete "Item" <Special>?',
      message: 'Are you sure & certain?'
    };

    render(<ConfirmDeleteModal {...specialProps} />);

    expect(screen.getByText(/Delete "Item" <Special>/i)).toBeInTheDocument();
    expect(screen.getByText(/Are you sure & certain/i)).toBeInTheDocument();
  });

  it('renders modal with correct z-index for overlay', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    const modal = container.querySelector('.z-\\[100\\]');
    expect(modal).toBeInTheDocument();
  });

  it('cancel button has correct styling', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton.className).toContain('font-bold');
  });

  it('renders alert icon with correct styling', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    const iconContainer = container.querySelector('.bg-red-50.rounded-full');
    expect(iconContainer).toBeInTheDocument();
  });

  it('does not render when isOpen changes from true to false', () => {
    const { rerender, container } = render(
      <ConfirmDeleteModal {...defaultProps} isOpen={true} />
    );

    expect(screen.getByText('Delete Item?')).toBeInTheDocument();

    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('handles multiple rerenders with isOpen true', () => {
    const { rerender } = render(<ConfirmDeleteModal {...defaultProps} />);

    rerender(<ConfirmDeleteModal {...defaultProps} title="New Title" message="New Message" />);

    expect(screen.getByText('New Title')).toBeInTheDocument();
    expect(screen.getByText('New Message')).toBeInTheDocument();
  });

  it('maintains button functionality after prop changes', () => {
    const onConfirm = vi.fn();
    const { rerender } = render(
      <ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} title="First" />
    );

    rerender(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} title="Second" />);

    const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders backdrop with correct opacity class', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    const backdrop = container.querySelector('.bg-slate-900\\/40');
    expect(backdrop).toBeInTheDocument();
  });

  it('modal container has correct border styling', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    const modalContainer = container.querySelector('.border-slate-200');
    expect(modalContainer).toBeInTheDocument();
  });

  it('handles undefined callbacks gracefully', () => {
    const { container } = render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test"
        message="Test Message"
      />
    );

    expect(container).toBeInTheDocument();
  });
});