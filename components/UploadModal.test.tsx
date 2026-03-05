import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadModal } from './UploadModal';
import { Priority } from '../types';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

// Mock geminiService
vi.mock('../services/geminiService', () => ({
  analyzeInvitation: vi.fn(),
}));

describe('UploadModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onAnalysisComplete: vi.fn(),
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
    it('should render modal header', () => {
      render(<UploadModal {...defaultProps} />);

      expect(screen.getByText('Process Invitation')).toBeInTheDocument();
      expect(screen.getByText('Powered by Gemma-2-27b-it • Optimized for Email Parsing')).toBeInTheDocument();
    });

    it('should render mode toggle buttons', () => {
      render(<UploadModal {...defaultProps} />);

      expect(screen.getByText('Paste Email Content')).toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<UploadModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Analyze with AI')).toBeInTheDocument();
    });

    it('should default to text mode', () => {
      render(<UploadModal {...defaultProps} />);

      expect(screen.getByPlaceholderText(/Paste the full email/i)).toBeInTheDocument();
    });
  });

  describe('Mode Switching', () => {
    it('should switch to file mode when Upload Document is clicked', () => {
      render(<UploadModal {...defaultProps} />);

      const fileButton = screen.getByText('Upload Document');
      fireEvent.click(fileButton);

      expect(screen.getByText('Drop PDF or DOCX invitation')).toBeInTheDocument();
    });

    it('should switch back to text mode when Paste Email Content is clicked', () => {
      render(<UploadModal {...defaultProps} />);

      // Switch to file mode
      fireEvent.click(screen.getByText('Upload Document'));
      expect(screen.getByText('Drop PDF or DOCX invitation')).toBeInTheDocument();

      // Switch back to text mode
      fireEvent.click(screen.getByText('Paste Email Content'));
      expect(screen.getByPlaceholderText(/Paste the full email/i)).toBeInTheDocument();
    });

    it('should apply active styles to selected mode', () => {
      render(<UploadModal {...defaultProps} />);

      const textButton = screen.getByText('Paste Email Content');
      expect(textButton).toHaveClass('bg-white');
      expect(textButton).toHaveClass('text-blue-600');

      const fileButton = screen.getByText('Upload Document');
      expect(fileButton).not.toHaveClass('bg-white');
    });
  });

  describe('Text Mode', () => {
    it('should render textarea in text mode', () => {
      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should update textarea value when typing', () => {
      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation text' } });

      expect(textarea).toHaveValue('Test invitation text');
    });

    it('should show pro-tip message', () => {
      render(<UploadModal {...defaultProps} />);

      expect(screen.getByText(/Pro-tip: Include the email 'Subject'/i)).toBeInTheDocument();
    });

    it('should show error when analyze is clicked with empty text', () => {
      render(<UploadModal {...defaultProps} />);

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      expect(screen.getByText('Paste the invitation content first.')).toBeInTheDocument();
    });

    it('should not show error for whitespace-only text before clicking analyze', () => {
      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: '   ' } });

      expect(screen.queryByText('Paste the invitation content first.')).not.toBeInTheDocument();
    });
  });

  describe('File Mode', () => {
    it('should render file input in file mode', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
    });

    it('should display selected file name', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('should show default message when no file is selected', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      expect(screen.getByText('Drop PDF or DOCX invitation')).toBeInTheDocument();
    });

    it('should show error when analyze is clicked without file', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      expect(screen.getByText('Select a document first.')).toBeInTheDocument();
    });

    it('should clear error when file is selected', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      // First trigger error
      fireEvent.click(screen.getByText('Analyze with AI'));
      expect(screen.getByText('Select a document first.')).toBeInTheDocument();

      // Then select file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(screen.queryByText('Select a document first.')).not.toBeInTheDocument();
    });
  });

  describe('Analysis Process', () => {
    it('should show progress overlay when analyzing', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  sender: 'Test',
                  institution: 'Test Inst',
                  eventName: 'Test Event',
                  theme: 'Test Theme',
                  description: 'Test',
                  priority: Priority.High,
                  priorityScore: 90,
                  priorityReasoning: 'Test',
                  date: '2026-06-15',
                  venue: 'Test Venue',
                  initialDeadline: '',
                  finalDeadline: '',
                  linkedActivities: [],
                }),
              100
            )
          )
      );

      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      expect(screen.getByText('Analyzing Invitation')).toBeInTheDocument();
      expect(screen.getByText(/Extracting metadata/i)).toBeInTheDocument();
    });

    it('should disable analyze button during analysis', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeButton).toBeDisabled();
      });
    });

    it('should show progress bar during analysis', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockImplementation(() => new Promise(() => {}));

      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Uploading')).toBeInTheDocument();
        expect(screen.getByText('Processing')).toBeInTheDocument();
        expect(screen.getByText('Complete')).toBeInTheDocument();
      });
    });

    it('should call onAnalysisComplete with correct data on success', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      const mockAnalysisResult = {
        sender: 'Test Sender',
        institution: 'Test Institution',
        eventName: 'Test Event',
        theme: 'Education',
        description: 'Test Description',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'High relevance',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: ['Activity 1'],
      };

      vi.mocked(analyzeInvitation).mockResolvedValue(mockAnalysisResult);

      const onAnalysisComplete = vi.fn();
      render(<UploadModal {...defaultProps} onAnalysisComplete={onAnalysisComplete} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation text' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'test-uuid-123',
            originalText: 'Test invitation text',
            analysis: mockAnalysisResult,
          })
        );
      });
    });

    it('should call onClose after successful analysis', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      const onClose = vi.fn();
      render(<UploadModal {...defaultProps} onClose={onClose} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('should show error message when analysis fails', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockRejectedValue(new Error('API Error'));

      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/i)).toBeInTheDocument();
      });
    });

    it('should reset progress on error', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockRejectedValue(new Error('API Error'));

      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: 'Test invitation' } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/Analysis failed/i)).toBeInTheDocument();
      });

      // Should be able to try again
      expect(analyzeButton).not.toBeDisabled();
    });
  });

  describe('File Type Validation', () => {
    it('should reject unsupported file types', async () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText('Unsupported file format. Please use PDF or DOCX.')).toBeInTheDocument();
      });
    });

    it('should accept PDF files', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeInvitation).toHaveBeenCalledWith(
          expect.objectContaining({
            fileData: expect.objectContaining({
              mimeType: 'application/pdf',
            }),
          })
        );
      });
    });

    it('should accept DOCX files', async () => {
      const mammoth = await import('mammoth');
      const { analyzeInvitation } = await import('../services/geminiService');

      vi.mocked(mammoth.default.extractRawText).mockResolvedValue({
        value: 'Extracted text from DOCX',
        messages: [],
      });

      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeInvitation).toHaveBeenCalledWith(
          expect.objectContaining({
            text: 'Extracted text from DOCX',
          })
        );
      });
    });
  });

  describe('Modal Behavior', () => {
    it('should call onClose when X button is clicked', () => {
      const onClose = vi.fn();
      render(<UploadModal {...defaultProps} onClose={onClose} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find((btn) => btn.querySelector('svg'));

      fireEvent.click(xButton!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<UploadModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<UploadModal {...defaultProps} onClose={onClose} />);

      const backdrop = document.querySelector('.bg-slate-900\\/60');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible file input', () => {
      render(<UploadModal {...defaultProps} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
    });

    it('should have accessible buttons', () => {
      render(<UploadModal {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(3); // Mode buttons + Cancel + Analyze
    });

    it('should have proper textarea attributes', () => {
      render(<UploadModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long text input', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      render(<UploadModal {...defaultProps} />);

      const longText = 'A'.repeat(10000);
      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: longText } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeInvitation).toHaveBeenCalledWith(
          expect.objectContaining({
            text: longText,
          })
        );
      });
    });

    it('should handle special characters in text', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      render(<UploadModal {...defaultProps} />);

      const specialText = 'Test <>&"\' invitation';
      const textarea = screen.getByPlaceholderText(/Paste the full email/i);
      fireEvent.change(textarea, { target: { value: specialText } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(analyzeInvitation).toHaveBeenCalledWith(
          expect.objectContaining({
            text: specialText,
          })
        );
      });
    });

    it('should store file name in originalText when analyzing file', async () => {
      const { analyzeInvitation } = await import('../services/geminiService');
      vi.mocked(analyzeInvitation).mockResolvedValue({
        sender: 'Test',
        institution: 'Test Inst',
        eventName: 'Test Event',
        theme: 'Test Theme',
        description: 'Test',
        priority: Priority.High,
        priorityScore: 90,
        priorityReasoning: 'Test',
        date: '2026-06-15',
        venue: 'Test Venue',
        initialDeadline: '',
        finalDeadline: '',
        linkedActivities: [],
      });

      const onAnalysisComplete = vi.fn();
      render(<UploadModal {...defaultProps} onAnalysisComplete={onAnalysisComplete} />);

      fireEvent.click(screen.getByText('Upload Document'));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'invitation.pdf', { type: 'application/pdf' });

      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(fileInput);

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(onAnalysisComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            originalText: 'File: invitation.pdf',
          })
        );
      });
    });
  });
});