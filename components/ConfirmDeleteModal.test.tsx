import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '@testing-library/jest-dom/vitest';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Delete',
    message: 'Are you sure you want to delete this item?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
  });

  it('calls onClose when clicking the backdrop', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    // The backdrop has a specific class identifying it
    const backdrop = container.querySelector('.bg-slate-900\\/40');
    if (backdrop) {
        fireEvent.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    } else {
        throw new Error('Backdrop not found');
    }
  });

  it('calls onClose when clicking the Cancel button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the X button', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // The X button is the first button in the DOM structure (header)
    const xButton = buttons[0];
    fireEvent.click(xButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when clicking Delete Permanently', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteButton = screen.getByText('Delete Permanently');
    fireEvent.click(deleteButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
