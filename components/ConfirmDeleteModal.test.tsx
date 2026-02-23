import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { vi, describe, it, expect } from 'vitest';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
  };

  it('renders correctly when open', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this item?')).toBeInTheDocument();
    expect(screen.getByText('Delete Permanently')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ConfirmDeleteModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onConfirm and onClose when Delete Permanently is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Delete Permanently'));
    expect(defaultProps.onConfirm).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders default title and message if not provided', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
  });
});
