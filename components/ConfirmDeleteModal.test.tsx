import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ConfirmDeleteModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when Delete Permanently is clicked', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Delete Permanently'));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the backdrop', () => {
    const { container } = render(<ConfirmDeleteModal {...defaultProps} />);
    const backdrop = container.firstChild as HTMLElement;
    fireEvent.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the modal', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete Item'));
    expect(defaultProps.onClose).not.toHaveBeenCalled();
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
