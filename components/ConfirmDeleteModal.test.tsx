import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import '@testing-library/jest-dom';

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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders correctly with accessibility attributes when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-message');

    expect(screen.getByText('Confirm Delete')).toHaveAttribute('id', 'modal-title');
    expect(screen.getByText('Are you sure you want to delete this item?')).toHaveAttribute('id', 'modal-message');

    expect(screen.getByLabelText('Close')).toBeInTheDocument();
  });

  it('calls onClose when clicking the backdrop', async () => {
    const user = userEvent.setup();
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);

    // Target backdrop using class selector for precision
    const backdrop = container.querySelector('.bg-slate-900\\/40');
    expect(backdrop).toBeInTheDocument();

    if (backdrop) {
        await user.click(backdrop);
        expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('calls onClose when clicking the Cancel button', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteModal {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the Close (X) button', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteModal {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close');
    await user.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when clicking Delete Permanently', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteModal {...defaultProps} />);
    const deleteButton = screen.getByRole('button', { name: /delete permanently/i });
    await user.click(deleteButton);

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when pressing Escape key', async () => {
    const user = userEvent.setup();
    render(<ConfirmDeleteModal {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('adds and removes event listener for Escape key', async () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<ConfirmDeleteModal {...defaultProps} />);

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
