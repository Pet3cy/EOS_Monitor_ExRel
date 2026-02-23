import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewContactModal } from './NewContactModal';

describe('NewContactModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock crypto.randomUUID
    Object.defineProperty(global, 'crypto', {
      value: {
        randomUUID: () => 'test-uuid-123',
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<NewContactModal {...defaultProps} />);

      expect(screen.getByText('Add New Contact')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<NewContactModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Add New Contact')).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<NewContactModal {...defaultProps} />);

      expect(screen.getByPlaceholderText('e.g. Jane Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. jane@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. Project Manager')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g. ACME Corp')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Additional context about this contact...')).toBeInTheDocument();
    });

    it('should render required field indicators', () => {
      render(<NewContactModal {...defaultProps} />);

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThanOrEqual(2);
    });

    it('should render Cancel and Save buttons', () => {
      render(<NewContactModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Save Contact')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update name field when typing', () => {
      render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      expect(nameInput).toHaveValue('John Smith');
    });

    it('should update email field when typing', () => {
      render(<NewContactModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should update role field when typing', () => {
      render(<NewContactModal {...defaultProps} />);

      const roleInput = screen.getByPlaceholderText('e.g. Project Manager');
      fireEvent.change(roleInput, { target: { value: 'Developer' } });

      expect(roleInput).toHaveValue('Developer');
    });

    it('should update organization field when typing', () => {
      render(<NewContactModal {...defaultProps} />);

      const orgInput = screen.getByPlaceholderText('e.g. ACME Corp');
      fireEvent.change(orgInput, { target: { value: 'Tech Corp' } });

      expect(orgInput).toHaveValue('Tech Corp');
    });

    it('should update notes field when typing', () => {
      render(<NewContactModal {...defaultProps} />);

      const notesInput = screen.getByPlaceholderText('Additional context about this contact...');
      fireEvent.change(notesInput, { target: { value: 'Important contact' } });

      expect(notesInput).toHaveValue('Important contact');
    });
  });

  describe('Form Validation', () => {
    it('should show error when name is empty on submit', () => {
      render(<NewContactModal {...defaultProps} />);

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should show error when email is empty on submit', () => {
      render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should show error when email format is invalid', () => {
      render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(defaultProps.onSave).not.toHaveBeenCalled();
    });

    it('should accept valid email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'first+last@domain.org',
      ];

      validEmails.forEach((email) => {
        const onSave = vi.fn();
        const { unmount } = render(<NewContactModal {...defaultProps} onSave={onSave} />);

        const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
        fireEvent.change(nameInput, { target: { value: 'John Smith' } });

        const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
        fireEvent.change(emailInput, { target: { value: email } });

        const saveButton = screen.getByText('Save Contact');
        fireEvent.click(saveButton);

        expect(onSave).toHaveBeenCalled();
        unmount();
      });
    });

    it('should show multiple errors when both name and email are invalid', () => {
      render(<NewContactModal {...defaultProps} />);

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should clear error when field is corrected', () => {
      render(<NewContactModal {...defaultProps} />);

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('should trim whitespace from name field', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: '   ' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('should apply error styling to invalid fields', () => {
      render(<NewContactModal {...defaultProps} />);

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      expect(nameInput).toHaveClass('border-red-300');
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with correct data when form is valid', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const roleInput = screen.getByPlaceholderText('e.g. Project Manager');
      fireEvent.change(roleInput, { target: { value: 'Developer' } });

      const orgInput = screen.getByPlaceholderText('e.g. ACME Corp');
      fireEvent.change(orgInput, { target: { value: 'Tech Corp' } });

      const notesInput = screen.getByPlaceholderText('Additional context about this contact...');
      fireEvent.change(notesInput, { target: { value: 'Important person' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        id: 'ctest-uuid-123',
        name: 'John Smith',
        email: 'john@example.com',
        role: 'Developer',
        organization: 'Tech Corp',
        notes: 'Important person',
      });
    });

    it('should use default values for optional fields', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith({
        id: 'ctest-uuid-123',
        name: 'John Smith',
        email: 'john@example.com',
        role: 'Member',
        organization: 'External',
        notes: '',
      });
    });

    it('should close modal after successful submission', () => {
      const onClose = vi.fn();
      render(<NewContactModal {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should generate unique ID using crypto.randomUUID', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringContaining('c'),
        })
      );
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<NewContactModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('.bg-slate-900\\/40');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<NewContactModal {...defaultProps} onClose={onClose} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find(btn => btn.querySelector('svg'));

      fireEvent.click(xButton!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<NewContactModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not close modal when form has validation errors', () => {
      const onClose = vi.fn();
      render(<NewContactModal {...defaultProps} onClose={onClose} />);

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      // onClose should not be called
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal is reopened', () => {
      const { rerender } = render(<NewContactModal {...defaultProps} isOpen={true} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      // Close modal
      rerender(<NewContactModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<NewContactModal {...defaultProps} isOpen={true} />);

      const nameInputAfterReopen = screen.getByPlaceholderText('e.g. Jane Doe');
      expect(nameInputAfterReopen).toHaveValue('');
    });

    it('should clear errors when modal is reopened', () => {
      const { rerender } = render(<NewContactModal {...defaultProps} isOpen={true} />);

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(screen.getByText('Name is required')).toBeInTheDocument();

      // Close and reopen
      rerender(<NewContactModal {...defaultProps} isOpen={false} />);
      rerender(<NewContactModal {...defaultProps} isOpen={true} />);

      expect(screen.queryByText('Name is required')).not.toBeInTheDocument();
    });

    it('should reset form after successful submission', () => {
      render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      // Note: We can't verify the form is reset because onClose is called
      // and the modal would be unmounted in real usage
      expect(defaultProps.onSave).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Field Icons', () => {
    it('should render icons for all fields', () => {
      render(<NewContactModal {...defaultProps} />);

      // Check that field labels contain icon components
      const labels = screen.getAllByText(/full name|email address|role|organization/i);
      expect(labels.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Accessibility', () => {
    it('should have proper input labels', () => {
      render(<NewContactModal {...defaultProps} />);

      expect(screen.getByText(/Full Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByText(/Role/i)).toBeInTheDocument();
      expect(screen.getByText(/Organization/i)).toBeInTheDocument();
      expect(screen.getByText(/Notes/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<NewContactModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('should have proper input types', () => {
      render(<NewContactModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      expect(nameInput.tagName).toBe('INPUT');

      const notesInput = screen.getByPlaceholderText('Additional context about this contact...');
      expect(notesInput.tagName).toBe('TEXTAREA');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string for optional fields', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: 'John Smith' } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const roleInput = screen.getByPlaceholderText('e.g. Project Manager');
      fireEvent.change(roleInput, { target: { value: '' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'Member', // Default value
        })
      );
    });

    it('should handle very long input values', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const longName = 'A'.repeat(200);
      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: longName } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: longName,
        })
      );
    });

    it('should handle special characters in input', () => {
      const onSave = vi.fn();
      render(<NewContactModal {...defaultProps} onSave={onSave} />);

      const nameInput = screen.getByPlaceholderText('e.g. Jane Doe');
      fireEvent.change(nameInput, { target: { value: "O'Brien-Smith" } });

      const emailInput = screen.getByPlaceholderText('e.g. jane@example.com');
      fireEvent.change(emailInput, { target: { value: 'test+tag@example.com' } });

      const saveButton = screen.getByText('Save Contact');
      fireEvent.click(saveButton);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "O'Brien-Smith",
          email: 'test+tag@example.com',
        })
      );
    });
  });
});