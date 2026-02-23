import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

describe('ConfirmDeleteModal', () => {
  let defaultProps: any;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onConfirm: vi.fn(),
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item?'
    };
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render title and message when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.message)).toBeInTheDocument();
  });

  it('should call onClose when clicking the Cancel button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking the backdrop', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    // The backdrop is the first child of the fixed container in the current implementation
    // and it has an onClick={onClose}
    // We can find it by looking for the div that has the backdrop-blur-sm class
    const backdrop = document.querySelector('.backdrop-blur-sm');
    if (!backdrop) throw new Error('Backdrop not found');
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking the close (X) button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    // The X icon is inside a button. lucide-react X usually has data-testid or we can find by close button
    // The close button is the one with className containing "text-slate-400" or we can just use the first button if we are careful
    // Actually, it's better to use a selector that is robust.
    // In the component:
    // <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors">
    //   <X size={18} />
    // </button>
    const closeButton = screen.getAllByRole('button')[0]; // It's the first button in the DOM order
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirm and onClose when clicking the Delete Permanently button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteButton = screen.getByText(/delete permanently/i);
    fireEvent.click(deleteButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
