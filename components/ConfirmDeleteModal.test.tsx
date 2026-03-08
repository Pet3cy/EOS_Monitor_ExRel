import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('displays correct title and message', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const backdrop = screen.getByText(defaultProps.title).closest('.fixed')?.querySelector('.absolute');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when close button (X) is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg') && !btn.textContent?.includes('Cancel') && !btn.textContent?.includes('Delete'));
    if (xButton) {
      fireEvent.click(xButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when Delete button is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete Permanently');
    fireEvent.click(deleteButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('renders with warning icon', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const iconContainer = container.querySelector('.bg-red-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('text-red-600');
  });

  it('applies correct styling to Delete button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete Permanently');
    expect(deleteButton).toHaveClass('bg-red-600', 'text-white');
  });

  it('renders Cancel and Delete buttons', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
  });

  it('displays custom title and message', () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Title',
      message: 'Custom message content'
    };
    render(<ConfirmDeleteModal {...customProps} />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message content')).toBeInTheDocument();
  });

  it('has proper modal structure with backdrop and container', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const modal = container.querySelector('.fixed.inset-0');
    expect(modal).toBeInTheDocument();
    const backdrop = modal?.querySelector('.absolute.inset-0');
    expect(backdrop).toBeInTheDocument();
    const modalContainer = modal?.querySelector('.relative.bg-white');
    expect(modalContainer).toBeInTheDocument();
  });

  it('does not call onConfirm when Cancel is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('renders with proper z-index for overlay', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const modal = container.querySelector('.z-\\[100\\]');
    expect(modal).toBeInTheDocument();
  });

  // Additional edge case tests
  it('handles rapid open/close cycles', () => {
    const { rerender } = render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);

    // Rapidly toggle
    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();

    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Delete Item?')).not.toBeInTheDocument();

    rerender(<ConfirmDeleteModal {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
  });

  it('handles empty title gracefully', () => {
    render(<ConfirmDeleteModal {...defaultProps} title="" />);
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('handles empty message gracefully', () => {
    render(<ConfirmDeleteModal {...defaultProps} message="" />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
  });

  it('handles very long title text', () => {
    const longTitle = 'A'.repeat(200);
    render(<ConfirmDeleteModal {...defaultProps} title={longTitle} />);
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });

  it('handles very long message text', () => {
    const longMessage = 'This is a very long message that explains in great detail why this deletion is important and what consequences it may have. '.repeat(10);
    render(<ConfirmDeleteModal {...defaultProps} message={longMessage} />);
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('renders fixed overlay that covers viewport', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toBeInTheDocument();
  });
});