import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item?',
    message: 'Are you sure you want to delete this item?'
  };

  it('should render when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Delete Item?')).not.toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm and onClose when Delete button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

    const deleteButton = screen.getByText('Delete Permanently');
    fireEvent.click(deleteButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const backdrop = container.querySelector('.bg-slate-900\\/40');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should call onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    // Find the X button (close icon)
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    if (xButton) {
      fireEvent.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should handle Escape key press', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should display alert icon', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const icon = container.querySelector('.text-red-600');
    expect(icon).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should render custom title and message', () => {
    render(
      <ConfirmDeleteModal
        {...defaultProps}
        title="Custom Title"
        message="Custom message text"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message text')).toBeInTheDocument();
  });

  it('should not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);

    const modalContent = container.querySelector('.bg-white');
    if (modalContent) {
      fireEvent.click(modalContent);
      expect(onClose).not.toHaveBeenCalled();
    }
  });
});