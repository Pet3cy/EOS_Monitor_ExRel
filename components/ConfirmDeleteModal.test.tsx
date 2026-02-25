import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import React from 'react';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Confirm Delete',
    message: 'Are you sure?',
  };

  it('renders correctly when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Delete')).not.toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    // Select the backdrop div (first child of the fixed container)
    const backdrop = container.querySelector('.fixed > div.absolute');

    if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
    } else {
        throw new Error('Backdrop not found');
    }
  });

  it('calls onClose when close button (X) is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    // The close button is the one without text (contains icon)
    const closeButton = buttons.find(btn => !btn.textContent);

    if (closeButton) {
        fireEvent.click(closeButton);
        expect(onClose).toHaveBeenCalledTimes(1);
    } else {
        throw new Error('Close button not found');
    }
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when Delete Permanently button is clicked', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} onClose={onClose} />);

    fireEvent.click(screen.getByText('Delete Permanently'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
