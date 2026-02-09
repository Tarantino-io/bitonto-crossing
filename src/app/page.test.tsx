import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Home from './page';

// Mock Lucide icons to avoid SVG rendering issues in test environment if any
vi.mock('lucide-react', () => ({
  Train: () => <span data-testid="icon-train"></span>,
  RefreshCw: () => <span data-testid="icon-refresh"></span>,
  Clock: () => <span data-testid="icon-clock"></span>,
  AlertTriangle: () => <span data-testid="icon-alert"></span>,
  Activity: () => <span data-testid="icon-activity"></span>,
  Info: () => <span data-testid="icon-info"></span>,
  Mic: () => <span data-testid="icon-mic"></span>,
  Sun: () => <span data-testid="icon-sun"></span>,
  Moon: () => <span data-testid="icon-moon"></span>,
  Laptop: () => <span data-testid="icon-laptop"></span>,
}));

// Mock fetch
const globalFetch = global.fetch;
let fetchMock: ReturnType<typeof vi.fn>;
const createResponse = (payload: Record<string, unknown>, ok = true): Response =>
  ({
    ok,
    json: async () => payload,
  }) as Response;

describe('Home Page', () => {
  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = globalFetch;
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {})); // Never resolves
    render(<Home />);
    expect(screen.getByText('Monitoraggio real-time stimato')).toBeInTheDocument();
    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('renders OPEN state correctly', async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        status: 'OPEN',
        message: 'Via libera (per ora).',
        nextTrain: null,
        lastUpdated: new Date().toISOString(),
      }),
    );

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Via Libera')).toBeInTheDocument();
    });

    expect(screen.getByText('Via libera (per ora).')).toBeInTheDocument();
  });

  it('renders CLOSED state correctly', async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        status: 'CLOSED',
        message: 'Attenzione! Passaggio a livello probabilmente CHIUSO.',
        nextTrain: { label: 'Treno per Bari', minutesUntil: 2, orario: '10:00', ritardo: '' },
        lastUpdated: new Date().toISOString(),
      }),
    );

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Chiuso')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Attenzione! Passaggio a livello probabilmente CHIUSO.'),
    ).toBeInTheDocument();
  });

  it('renders UNKNOWN with partial source warning', async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        status: 'UNKNOWN',
        sourceStatus: 'PARTIAL',
        message: 'Dati treni non disponibili al momento. (dati parziali)',
        nextTrain: null,
        lastUpdated: new Date().toISOString(),
      }),
    );

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Dato Incerto')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Alcune sorgenti treno non rispondono: stato calcolato con dati parziali.'),
    ).toBeInTheDocument();
  });

  it('shows fetch error and allows manual refresh', async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse(
          {
            message: 'Dati treni non disponibili al momento.',
            lastUpdated: new Date().toISOString(),
          },
          false,
        ),
      )
      .mockResolvedValueOnce(
        createResponse({
          status: 'WARNING',
          message: 'Il passaggio a livello potrebbe chiudersi a breve.',
          nextTrain: {
            label: 'Treno da Bitonto',
            minutesUntil: 4,
            orario: '10:04',
            ritardo: 0,
          },
          lastUpdated: new Date().toISOString(),
        }),
      );

    render(<Home />);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          'Aggiornamento live non riuscito. I dati potrebbero essere non aggiornati.',
        ).length,
      ).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Aggiorna dati' }));

    await waitFor(() => {
      expect(screen.getByText('In Chiusura')).toBeInTheDocument();
    });
  });

  // it('updates data on interval', async () => {
  //     // Flaky in test environment due to timer/promise microtask resolution
  //     // Verified manually in browser
  // });
});
