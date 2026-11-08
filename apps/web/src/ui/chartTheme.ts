import { useState, useEffect, useMemo } from 'react';
import type { Chart, ChartType, TooltipModel } from 'chart.js';
import { useReducedMotion } from './motion';
import { formatIndianGrouping } from '../components/ui/formatIndianGrouping';

export interface ThemeTokens {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  lineStrong: string;
  ink: string;
  ink2: string;
  ink3: string;
  accent: string;
  accentTint: string;
  income: string;
  incomeTint: string;
  warning: string;
  warningTint: string;
  danger: string;
  dangerTint: string;
  fontBody: string;
  fontDisplay: string;
}

/**
 * Reads CSS variables with getComputedStyle (SPEC Section 3)
 */
export function getThemeTokens(): ThemeTokens {
  if (typeof window === 'undefined') {
    return {
      bg: '#FAF7F2',
      surface: '#FFFFFF',
      surface2: '#F3EEE6',
      line: '#E6DFD3',
      lineStrong: '#D3C9B9',
      ink: '#1F1B16',
      ink2: '#5C554B',
      ink3: '#766E62',
      accent: '#2A4FD6',
      accentTint: '#E6EBFB',
      income: '#2E7D5B',
      incomeTint: '#E4F2EA',
      warning: '#9A6700',
      warningTint: '#F6E8C8',
      danger: '#B3261E',
      dangerTint: '#F8E1DE',
      fontBody: "'Instrument Sans', sans-serif",
      fontDisplay: "'Bricolage Grotesque', sans-serif",
    };
  }

  const computed = getComputedStyle(document.documentElement);
  return {
    bg: computed.getPropertyValue('--bg').trim() || '#FAF7F2',
    surface: computed.getPropertyValue('--surface').trim() || '#FFFFFF',
    surface2: computed.getPropertyValue('--surface-2').trim() || '#F3EEE6',
    line: computed.getPropertyValue('--line').trim() || '#E6DFD3',
    lineStrong: computed.getPropertyValue('--line-strong').trim() || '#D3C9B9',
    ink: computed.getPropertyValue('--ink').trim() || '#1F1B16',
    ink2: computed.getPropertyValue('--ink-2').trim() || '#5C554B',
    ink3: computed.getPropertyValue('--ink-3').trim() || '#766E62',
    accent: computed.getPropertyValue('--accent').trim() || '#2A4FD6',
    accentTint: computed.getPropertyValue('--accent-tint').trim() || '#E6EBFB',
    income: computed.getPropertyValue('--income').trim() || '#2E7D5B',
    incomeTint: computed.getPropertyValue('--income-tint').trim() || '#E4F2EA',
    warning: computed.getPropertyValue('--warning').trim() || '#9A6700',
    warningTint: computed.getPropertyValue('--warning-tint').trim() || '#F6E8C8',
    danger: computed.getPropertyValue('--danger').trim() || '#B3261E',
    dangerTint: computed.getPropertyValue('--danger-tint').trim() || '#F8E1DE',
    fontBody: computed.getPropertyValue('--font-body').trim() || "'Instrument Sans', sans-serif",
    fontDisplay: computed.getPropertyValue('--font-display').trim() || "'Bricolage Grotesque', sans-serif",
  };
}

/**
 * Shared custom HTML tooltip for Chart.js (SPEC Section 5 & 6)
 * - Rendered in --surface with 1px border --line, rounded-btn, --shadow-2
 * - Indian grouping for values
 * - Proper positioning and smooth opacity transitions
 */
export function customHtmlTooltip<TType extends ChartType = ChartType>(
  this: unknown,
  context: { chart: Chart; tooltip: TooltipModel<TType> },
) {
  const { chart, tooltip } = context;
  const parent = chart.canvas.parentNode as HTMLElement | null;
  if (!parent) return;

  let tooltipEl = parent.querySelector('.chartjs-custom-tooltip') as HTMLDivElement | null;
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.className = 'chartjs-custom-tooltip';
    tooltipEl.style.position = 'absolute';
    tooltipEl.style.pointerEvents = 'none';
    tooltipEl.style.zIndex = '50';
    tooltipEl.style.backgroundColor = 'var(--surface)';
    tooltipEl.style.color = 'var(--ink)';
    tooltipEl.style.border = '1px solid var(--line)';
    tooltipEl.style.borderRadius = 'var(--radius-btn, 10px)';
    tooltipEl.style.boxShadow = 'var(--shadow-2)';
    tooltipEl.style.padding = '8px 12px';
    tooltipEl.style.fontFamily = 'var(--font-body, "Instrument Sans", sans-serif)';
    tooltipEl.style.fontSize = '12px';
    tooltipEl.style.transition = 'opacity 120ms ease, transform 120ms ease';
    parent.style.position = 'relative';
    parent.appendChild(tooltipEl);
  }

  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = '0';
    return;
  }

  if (tooltip.body) {
    const titleLines = tooltip.title || [];
    const titleText = titleLines.join(' ');

    let html = '';
    if (titleText) {
      html += `<div style="font-weight: 600; color: var(--ink-2); margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid var(--line);">${titleText}</div>`;
    }
    html += '<div style="display: flex; flex-direction: column; gap: 4px;">';

    tooltip.dataPoints.forEach((point) => {
      const raw = point.raw as number | null;
      if (raw === null || raw === undefined) return;
      const formattedVal = typeof raw === 'number' ? `₹${formatIndianGrouping(raw)}` : String(raw);
      const ds = point.dataset as Record<string, unknown>;
      const label = (ds.label as string) || point.label || '';
      const dotColor =
        (ds.borderColor as string) ||
        (Array.isArray(ds.backgroundColor)
          ? (ds.backgroundColor[point.dataIndex] as string)
          : (ds.backgroundColor as string)) ||
        'var(--accent)';

      html += `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 14px;">
          <span style="display: flex; align-items: center; gap: 6px; color: var(--ink-2);">
            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${dotColor};"></span>
            <span>${label}</span>
          </span>
          <span style="font-weight: 600; font-variant-numeric: tabular-nums; color: var(--ink);">${formattedVal}</span>
        </div>
      `;
    });
    html += '</div>';

    if (tooltip.footer && tooltip.footer.length > 0) {
      html += `<div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid var(--line); font-size: 11px; color: var(--ink-3);">${tooltip.footer.join(' ')}</div>`;
    }

    tooltipEl.innerHTML = html;
  }

  const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;
  tooltipEl.style.opacity = '1';

  const tooltipWidth = tooltipEl.offsetWidth || 140;
  const tooltipHeight = tooltipEl.offsetHeight || 60;
  let left = positionX + tooltip.caretX - tooltipWidth / 2;
  let top = positionY + tooltip.caretY - tooltipHeight - 10;

  if (top < 0) {
    top = positionY + tooltip.caretY + 12;
  }
  if (parent) {
    const containerWidth = parent.clientWidth;
    if (left + tooltipWidth > containerWidth - 8) {
      left = containerWidth - tooltipWidth - 8;
    }
    if (left < 8) {
      left = 8;
    }
  }

  tooltipEl.style.left = `${left}px`;
  tooltipEl.style.top = `${top}px`;
}

/**
 * Remove lingering custom tooltip DOM elements
 */
export function cleanupChartTooltips() {
  if (typeof document !== 'undefined') {
    const tooltips = document.querySelectorAll('.chartjs-custom-tooltip');
    tooltips.forEach((t) => t.remove());
  }
}

export type ChartAnimationConfig = false | { duration: number; easing: 'easeOutQuart' };

/**
 * Hook to manage chart theme, tokens, and animation:
 * Animate 600 ms easeOutQuart on first render only; data updates use animation false.
 */
export function useChartTheme() {
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const prefersReduced = useReducedMotion();
  const themeTokens = useMemo(() => getThemeTokens(), []);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsFirstRender(false);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const animation = useMemo<ChartAnimationConfig>(() => {
    if (prefersReduced || !isFirstRender) return false;
    return {
      duration: 600,
      easing: 'easeOutQuart',
    };
  }, [prefersReduced, isFirstRender]);

  return {
    themeTokens,
    animation,
    isFirstRender,
    prefersReduced,
  };
}
