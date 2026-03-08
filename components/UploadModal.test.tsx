import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UploadModal } from './UploadModal';
import { Priority } from '../types';

// Mock mammoth
vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: 'Extracted text from docx' })
  }
}));

// Mock gemmaService
vi.mock('../services/gemmaService', () => ({
  analyzeInvitation: vi.fn().mockResolvedValue({
    sender: 'Test Sender',
    institution: 'Test Institution',
    eventName: 'Test Event',
    theme: 'Education',
    description: 'Test description',
    priority: Priority.High,
    priorityScore: 85,
    priorityReasoning: 'Test reasoning',
    date: '2026-05-15',
    venue: 'Test Venue',
    initialDeadline: '2026-04-01',
    finalDeadline: '2026-04-15',
    linkedActivities: []
  })
}));

import { analyzeInvitation } from '../services/gemmaService';
import mammoth from 'mammoth';

describe('UploadModal', () => {
  const defaultProps = {
    onClose: vi.fn(),
    onAnalysisComplete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText('Process Invitation')).toBeInTheDocument();
  });

  it('renders subtitle with AI model info', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText(/Powered by Gemini/)).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<UploadModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('svg'));
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<UploadModal {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(btn => btn.querySelector('svg') && !btn.textContent);
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    }
  });

  it('renders mode toggle buttons', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText('Paste Email Content')).toBeInTheDocument();
    expect(screen.getByText('Upload Document')).toBeInTheDocument();
  });

  it('defaults to text mode', () => {
    render(<UploadModal {...defaultProps} />);
    const pasteButton = screen.getByText('Paste Email Content');
    expect(pasteButton).toHaveClass('bg-white', 'text-blue-600');
  });

  it('switches to file mode when upload document is clicked', () => {
    render(<UploadModal {...defaultProps} />);
    const uploadButton = screen.getByText('Upload Document');
    fireEvent.click(uploadButton);

    expect(uploadButton).toHaveClass('bg-white', 'text-blue-600');
  });

  it('renders textarea in text mode', () => {
    render(<UploadModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    expect(textarea).toBeInTheDocument();
  });

  it('renders file upload area in file mode', () => {
    render(<UploadModal {...defaultProps} />);
    const uploadButton = screen.getByText('Upload Document');
    fireEvent.click(uploadButton);

    expect(screen.getByText(/Drop PDF, DOCX, EML, or TXT invitation/)).toBeInTheDocument();
  });

  it('updates text value when typing in textarea', () => {
    render(<UploadModal {...defaultProps} />);
    const textarea = screen.getByPlaceholderText(/Paste the full email/) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: 'Test event text' } });

    expect(textarea.value).toBe('Test event text');
  });

  it('displays error when analyzing empty text', async () => {
    render(<UploadModal {...defaultProps} />);

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Paste the invitation content first/)).toBeInTheDocument();
    });
  });

  it('displays error when no file is selected in file mode', async () => {
    render(<UploadModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Upload Document'));

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Select a document first/)).toBeInTheDocument();
    });
  });

  it('calls analyzeInvitation with text input', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test invitation text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(analyzeInvitation).toHaveBeenCalledWith({ text: 'Test invitation text' });
    });
  });

  it('shows progress overlay when analyzing', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Analyzing Invitation')).toBeInTheDocument();
  });

  it('shows progress bar when analyzing', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    expect(screen.getByText('Uploading')).toBeInTheDocument();
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('calls onAnalysisComplete with new event data', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(defaultProps.onAnalysisComplete).toHaveBeenCalled();
      const eventData = defaultProps.onAnalysisComplete.mock.calls[0][0];
      expect(eventData.analysis.eventName).toBe('Test Event');
      expect(eventData.analysis.institution).toBe('Test Institution');
    });
  });

  it('calls onClose after successful analysis', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  it('handles file selection', () => {
    render(<UploadModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Upload Document'));

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByText(/Drop PDF/).closest('div')?.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [file] } });
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    }
  });

  it('rejects files larger than 10MB', () => {
    render(<UploadModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Upload Document'));

    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const input = screen.getByText(/Drop PDF/).closest('div')?.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [largeFile] } });
      expect(screen.getByText(/File is too large/)).toBeInTheDocument();
    }
  });

  it('processes DOCX files using mammoth', async () => {
    render(<UploadModal {...defaultProps} />);

    fireEvent.click(screen.getByText('Upload Document'));

    const docxFile = new File(['docx content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const input = screen.getByText(/Drop PDF/).closest('div')?.querySelector('input[type="file"]');

    if (input) {
      fireEvent.change(input, { target: { files: [docxFile] } });

      const analyzeButton = screen.getByText('Analyze with AI');
      fireEvent.click(analyzeButton);

      await waitFor(() => {
        expect(mammoth.extractRawText).toHaveBeenCalled();
      });
    }
  });

  it('displays error on analysis failure', async () => {
    (analyzeInvitation as any).mockRejectedValueOnce(new Error('Analysis failed'));

    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/Analysis failed/)).toBeInTheDocument();
    });
  });

  it('disables analyze button when analyzing', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    expect(analyzeButton).toBeDisabled();
  });

  it('renders cancel button', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<UploadModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows helpful tip for email pasting', () => {
    render(<UploadModal {...defaultProps} />);
    expect(screen.getByText(/Pro-tip: Include the email 'Subject'/)).toBeInTheDocument();
  });

  it('displays file size limit', () => {
    render(<UploadModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Upload Document'));

    expect(screen.getByText('Maximum file size: 10MB')).toBeInTheDocument();
  });

  it('generates unique event ID for new events', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(defaultProps.onAnalysisComplete).toHaveBeenCalled();
      const eventData = defaultProps.onAnalysisComplete.mock.calls[0][0];
      expect(eventData.id).toBeTruthy();
      expect(eventData.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  it('initializes commsPack correctly for new events', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const eventData = defaultProps.onAnalysisComplete.mock.calls[0][0];
      expect(eventData.followUp.commsPack.datePlace).toContain('2026-05-15');
      expect(eventData.followUp.commsPack.datePlace).toContain('Test Venue');
    });
  });

  it('sets default status to To Respond', async () => {
    render(<UploadModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(/Paste the full email/);
    fireEvent.change(textarea, { target: { value: 'Test text' } });

    const analyzeButton = screen.getByText('Analyze with AI');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const eventData = defaultProps.onAnalysisComplete.mock.calls[0][0];
      expect(eventData.followUp.status).toBe('To Respond');
    });
  });
});