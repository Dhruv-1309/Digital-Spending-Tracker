import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { App } from '../App';

describe('404 Not Found & Unknown Route Handling (UX-4)', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/nonexistent-route-12345');
  });

  afterEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders 404 Not Found screen when navigating to an unrecognized route', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /Page Not Found/i })).toBeInTheDocument();
    expect(screen.getByText(/doesn't exist or has been moved/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to Dashboard/i })).toBeInTheDocument();
  });

  it('navigates back to the main app when clicking Return to Dashboard', () => {
    render(<App />);

    const backButton = screen.getByRole('button', { name: /Return to Dashboard/i });
    fireEvent.click(backButton);

    expect(window.location.pathname).toBe('/');
  });
});
