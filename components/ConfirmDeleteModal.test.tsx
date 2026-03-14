import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: 'Delete Item?',
  message: 'This action cannot be undone.',
};

describe('ConfirmDeleteModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ConfirmDeleteModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and message when isOpen is true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Item?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when Delete Permanently button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /delete permanently/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(
      <ConfirmDeleteModal {...defaultProps} onClose={onClose} />
    );
    // The backdrop is the first absolute div inside the outermost container
    const backdrop = container.querySelector('.absolute.inset-0');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose when Escape key is pressed (keyboard handler was removed)', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not have role="dialog" attribute on the container (removed in this PR)', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    // The outer wrapper div should not have role="dialog" since it was removed
    const dialogEl = container.querySelector('[role="dialog"]');
    expect(dialogEl).toBeNull();
  });

  it('renders the X close button and calls onClose when clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onClose={onClose} />);
    // There are two close buttons: the X icon button and the Cancel text button
    const buttons = screen.getAllByRole('button');
    // Find the X button (it does not have visible text, so identify by position or icon)
    // The Cancel button has text "Cancel", X button does not
    const xButton = buttons.find(b => !b.textContent?.match(/cancel|delete/i));
    expect(xButton).toBeDefined();
    fireEvent.click(xButton!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when Escape is pressed while modal is closed', () => {
    const onClose = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});