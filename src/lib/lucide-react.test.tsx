import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertTriangle, Clock, Laptop, Mic, Moon, RefreshCw, Sun, Train, X } from './lucide-react';

describe('lucide-react local shim', () => {
  it('renders all exported icons used by the UI', () => {
    render(
      <div>
        <AlertTriangle data-testid="icon-alert" />
        <Train data-testid="icon-train" />
        <RefreshCw data-testid="icon-refresh" />
        <Clock data-testid="icon-clock" />
        <Mic data-testid="icon-mic" />
        <X data-testid="icon-close" />
        <Moon data-testid="icon-moon" />
        <Sun data-testid="icon-sun" />
        <Laptop data-testid="icon-laptop" />
      </div>,
    );

    expect(screen.getByTestId('icon-alert')).toBeInTheDocument();
    expect(screen.getByTestId('icon-train')).toBeInTheDocument();
    expect(screen.getByTestId('icon-refresh')).toBeInTheDocument();
    expect(screen.getByTestId('icon-clock')).toBeInTheDocument();
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument();
    expect(screen.getByTestId('icon-close')).toBeInTheDocument();
    expect(screen.getByTestId('icon-moon')).toBeInTheDocument();
    expect(screen.getByTestId('icon-sun')).toBeInTheDocument();
    expect(screen.getByTestId('icon-laptop')).toBeInTheDocument();
  });

  it('passes standard SVG props through to the icon element', () => {
    render(<Sun data-testid="icon-sun-props" size={18} strokeWidth={1.5} aria-label="sun icon" />);

    const sun = screen.getByLabelText('sun icon');
    expect(sun).toHaveAttribute('width', '18');
    expect(sun).toHaveAttribute('height', '18');
    expect(sun).toHaveAttribute('stroke-width', '1.5');
  });
});
