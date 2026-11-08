import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { useTheme } from '../hooks/useTheme';
import { ChangelogDrawer } from '../components/help/ChangelogDrawer';

function TestThemeConsumer() {
  const { theme, resolvedTheme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="resolved-theme">{resolvedTheme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
    </div>
  );
}

describe('Theme Context & Night Palette Toggle (UX-23)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with system theme by default and reflects on documentElement', () => {
    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent(/light|dark/);
    expect(document.documentElement.getAttribute('data-theme')).toBeTruthy();
  });

  it('restores explicit dark theme from localStorage on initial load', () => {
    localStorage.setItem('mt_theme', 'dark');

    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles between dark and light themes and updates DOM and storage', () => {
    localStorage.setItem('mt_theme', 'light');

    render(
      <ThemeProvider>
        <TestThemeConsumer />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('mt_theme')).toBe('dark');

    act(() => {
      fireEvent.click(screen.getByTestId('toggle-btn'));
    });

    expect(screen.getByTestId('resolved-theme')).toHaveTextContent('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('mt_theme')).toBe('light');
  });
});

describe('In-App "What\'s New" Changelog Drawer (WEB-17)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders all notable releases with version badges and highlights when open', () => {
    const onClose = vi.fn();
    render(<ChangelogDrawer isOpen={true} onClose={onClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /What's New/i })).toBeInTheDocument();
    expect(screen.getByText('v3.0.0')).toBeInTheDocument();
    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText(/Safe to Spend Today/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank Statement CSV Import/i)).toBeInTheDocument();
  });

  it('updates localStorage to record the latest viewed changelog version', () => {
    expect(localStorage.getItem('mt_last_seen_changelog')).toBeNull();

    render(<ChangelogDrawer isOpen={true} onClose={vi.fn()} />);

    expect(localStorage.getItem('mt_last_seen_changelog')).toBe('3.0.0');
  });

  it('triggers onClose when close button is clicked or Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<ChangelogDrawer isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render drawer content when isOpen is false', () => {
    render(<ChangelogDrawer isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
