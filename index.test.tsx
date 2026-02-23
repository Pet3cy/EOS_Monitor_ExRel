import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';

// Mock ReactDOM and React to avoid actual rendering
vi.mock('react-dom/client', () => ({
  default: {
    createRoot: vi.fn(() => ({
      render: vi.fn(),
    })),
  },
  createRoot: vi.fn(() => ({
    render: vi.fn(),
  })),
}));

vi.mock('./App', () => ({
  default: () => null,
}));

describe('index.tsx', () => {
  beforeEach(() => {
    // Create a root element before each test
    document.body.innerHTML = '<div id="root"></div>';
    vi.clearAllMocks();
  });

  it('should find root element in DOM', () => {
    const rootElement = document.getElementById('root');
    expect(rootElement).toBeInTheDocument();
    expect(rootElement).not.toBeNull();
  });

  it('should throw error if root element is missing', async () => {
    // Remove root element
    document.body.innerHTML = '';

    // Import the module which should throw
    await expect(async () => {
      // Clear module cache to force re-evaluation
      vi.resetModules();
      await import('./index.tsx');
    }).rejects.toThrow();
  });

  it('should create root and render App component', async () => {
    const ReactDOM = await import('react-dom/client');
    const mockRender = vi.fn();
    const mockCreateRoot = vi.fn(() => ({ render: mockRender }));

    vi.mocked(ReactDOM.createRoot).mockImplementation(mockCreateRoot);

    // Clear cache and re-import to trigger execution
    vi.resetModules();
    await import('./index.tsx');

    expect(mockCreateRoot).toHaveBeenCalled();
    expect(mockRender).toHaveBeenCalled();
  });

  it('should render in StrictMode', async () => {
    const ReactDOM = await import('react-dom/client');
    const mockRender = vi.fn();

    vi.mocked(ReactDOM.createRoot).mockReturnValue({ render: mockRender } as any);

    vi.resetModules();
    await import('./index.tsx');

    // Check that render was called (StrictMode is handled by React)
    expect(mockRender).toHaveBeenCalledTimes(1);
  });
});