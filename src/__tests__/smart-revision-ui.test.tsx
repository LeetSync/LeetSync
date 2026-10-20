import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { SmartRevisionTracker } from '../components/revision/SmartRevisionTracker';
import { RevisionStorageService } from '../services/revisionStorage';

// Mock window.matchMedia which Chakra UI uses
// Mock window.matchMedia and ResizeObserver
beforeAll(() => {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });

  (window as any).ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

describe('SmartRevisionTracker UI Component', () => {
  beforeEach(async () => {
    RevisionStorageService.clearMemoryStorageForTests();
    const service = RevisionStorageService.getInstance();
    await service.recordSolve({
      slug: 'binary-search',
      title: 'Binary Search',
      frontendQuestionId: '704',
      difficulty: 'Easy',
      topicTags: ['Array', 'Binary Search'],
      isSuccess: true,
    });
  });

  const renderComponent = () =>
    render(
      <ChakraProvider>
        <SmartRevisionTracker />
      </ChakraProvider>
    );

  it('renders tracker header and main tabs', async () => {
    renderComponent();

    expect(await screen.findByText('Smart Revision Tracker')).toBeInTheDocument();
    expect(screen.getAllByText(/Overview/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Queue/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Topics/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Similar/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Reports/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/History/i).length).toBeGreaterThan(0);
  });

  it('displays overview counters and next revision card', async () => {
    renderComponent();

    expect(await screen.findByText('Problems In Tracker')).toBeInTheDocument();
    expect(screen.getByText('Revisions Completed')).toBeInTheDocument();
    expect(screen.getByText(/Top Revision Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Binary Search/i)).toBeInTheDocument();
  });

  it('switches to Queue tab and displays ranked problems with action buttons', async () => {
    renderComponent();

    const queueTab = await screen.findByText(/Queue/i);
    fireEvent.click(queueTab);

    expect(await screen.findByText('Total In Queue')).toBeInTheDocument();
    expect(screen.getAllByText(/Binary Search/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Revise')).toBeInTheDocument();
  });
});
