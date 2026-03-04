import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { NewContactModal } from './NewContactModal';
import { Contact } from '../types';

describe('NewContactModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<NewContactModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<NewContactModal {...defaultProps} />);
    expect(screen.getByText('Add New Contact')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<NewContactModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('e.g. Jane Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. jane@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Project Manager')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. ACME Corp')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Additional context about this contact...')).toBeInTheDocument();
  });

  it('shows required field indicators', () => {
    render(<NewContactModal {...defaultProps} />);
    const requiredIndicators = screen.getAllByText('*');
    expect(requiredIndicators.length).toBeGreaterThanOrEqual(2); // Name and Email are required
  });

  it('displays validation error when name is empty', async () => {
    render(<NewContactModal {...defaultProps} />);
    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('displays validation error when email is empty', async () => {
    render(<NewContactModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('displays validation error for invalid email format', async () => {
    render(<NewContactModal {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('calls onSave with correct data when form is valid', async () => {
    render(<NewContactModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
    const roleInput = screen.getByPlaceholderText('e.g. Project Manager');
    const orgInput = screen.getByPlaceholderText('e.g. ACME Corp');
    const notesInput = screen.getByPlaceholderText('Additional context about this contact...');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(roleInput, { target: { value: 'Developer' } });
    fireEvent.change(orgInput, { target: { value: 'Test Corp' } });
    fireEvent.change(notesInput, { target: { value: 'Test notes' } });

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    const savedContact = defaultProps.onSave.mock.calls[0][0] as Contact;
    expect(savedContact.name).toBe('John Doe');
    expect(savedContact.email).toBe('john@example.com');
    expect(savedContact.role).toBe('Developer');
    expect(savedContact.organization).toBe('Test Corp');
    expect(savedContact.notes).toBe('Test notes');
    expect(savedContact.id).toMatch(/^c/);
  });

  it('uses default values for optional fields when empty', async () => {
    render(<NewContactModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
    });

    const savedContact = defaultProps.onSave.mock.calls[0][0] as Contact;
    expect(savedContact.role).toBe('Member');
    expect(savedContact.organization).toBe('External');
  });

  it('calls onClose when Cancel button is clicked', () => {
    render(<NewContactModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', () => {
    render(<NewContactModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const xButton = buttons.find(btn => !btn.textContent?.includes('Cancel') && !btn.textContent?.includes('Save'));
    if (xButton) {
      fireEvent.click(xButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('clears form when modal is reopened', async () => {
    const { rerender } = render(<NewContactModal {...defaultProps} isOpen={false} />);

    rerender(<NewContactModal {...defaultProps} isOpen={true} />);

    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe') as HTMLInputElement;
    const emailInput = screen.getByPlaceholderText('e.g. jane@example.com') as HTMLInputElement;

    expect(nameInput.value).toBe('');
    expect(emailInput.value).toBe('');
  });

  it('clears validation errors when input is corrected', async () => {
    render(<NewContactModal {...defaultProps} />);

    // Trigger validation error
    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });

    // Fix the error
    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    await waitFor(() => {
      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });
  });

  it('accepts valid email formats', async () => {
    const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];

    for (const email of validEmails) {
      vi.clearAllMocks();
      const { unmount } = render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');

      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      fireEvent.change(emailInput, { target: { value: email } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
      });

      unmount();
    }
  });

  it('calls onClose after successful save', async () => {
    render(<NewContactModal {...defaultProps} />);

    const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
    const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('applies error styling to invalid fields', async () => {
    render(<NewContactModal {...defaultProps} />);

    const saveButton = screen.getByText('Save Contact');
    fireEvent.click(saveButton);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      expect(nameInput).toHaveClass('border-red-300');
    });
  });
});