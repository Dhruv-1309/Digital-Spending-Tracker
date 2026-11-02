import React, { useState } from 'react';
import * as Icons from '../icons';
import {
  Button,
  TextInput,
  AmountInput,
  SegmentedControl,
  Dropdown,
  DatePicker,
  DayOfMonthPicker,
  Card,
  Badge,
  ProgressBar,
  Skeleton,
  Banner,
  EmptyState,
  ToastContainerUI,
  ConfirmDialog,
  type ToastItemUI,
} from '../ui';

export function DesignSystemDevPage() {
  const [playAnim, setPlayAnim] = useState(false);

  // Phase 2 Primitives Showcase Interactive States
  const [btnLoading, setBtnLoading] = useState(false);
  const [textVal, setTextVal] = useState('Groceries shopping');
  const [textErr, setTextErr] = useState(false);
  const [amountVal, setAmountVal] = useState('125000');
  const [amountErr, setAmountErr] = useState(false);
  const [segmentedType, setSegmentedType] = useState('expense');
  const [segmentedPreset, setSegmentedPreset] = useState('month');
  const [dropdownVal, setDropdownVal] = useState('groceries');
  const [dropdownErr, setDropdownErr] = useState(false);
  const [dateVal, setDateVal] = useState('2026-11-02');
  const [autopayDayVal, setAutopayDayVal] = useState<number | string>(15);
  const [progressVal, setProgressVal] = useState(75);
  const [toasts, setToasts] = useState<ToastItemUI[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    variant: 'primary' | 'danger';
    title: string;
    message: string;
  }>({
    isOpen: false,
    variant: 'primary',
    title: '',
    message: '',
  });

  const triggerToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messages = {
      success: 'Transaction ₹1,250 recorded successfully.',
      error: 'Failed to synchronize with server. Queued for retry.',
      warning: 'You have reached 85% of your monthly entertainment budget.',
      info: 'Offline mode active. Changes will sync automatically.',
    };
    setToasts((prev) => [...prev, { id, type, message: messages[type], duration: 4000 }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const colors = [
    { token: '--bg', name: 'Background', hex: '#FAF7F2', textDark: true, use: 'App background' },
    { token: '--surface', name: 'Surface', hex: '#FFFFFF', textDark: true, use: 'Cards, inputs, modals' },
    { token: '--surface-2', name: 'Surface 2', hex: '#F3EEE6', textDark: true, use: 'Hover fills, table stripes, skeleton base' },
    { token: '--line', name: 'Line', hex: '#E6DFD3', textDark: true, use: 'Default borders and dividers' },
    { token: '--line-strong', name: 'Line Strong', hex: '#D3C9B9', textDark: true, use: 'Input borders, hovered borders' },
    { token: '--ink', name: 'Ink', hex: '#1F1B16', textDark: false, use: 'Primary text, figures' },
    { token: '--ink-2', name: 'Ink 2', hex: '#5C554B', textDark: false, use: 'Secondary text' },
    { token: '--ink-3', name: 'Ink 3', hex: '#766E62', textDark: false, use: 'Placeholders, captions' },
    { token: '--accent', name: 'Accent (Cobalt)', hex: '#2A4FD6', textDark: false, use: 'Primary buttons, links, focus ring' },
    { token: '--accent-tint', name: 'Accent Tint', hex: '#E6EBFB', textDark: true, use: 'Selected rows, active segment' },
    { token: '--income', name: 'Income', hex: '#2E7D5B', textDark: false, use: 'Income amounts and positive balance' },
    { token: '--income-tint', name: 'Income Tint', hex: '#E4F2EA', textDark: true, use: 'Income badges' },
    { token: '--warning', name: 'Warning', hex: '#9A6700', textDark: false, use: 'Approaching-limit text and bar' },
    { token: '--warning-tint', name: 'Warning Tint', hex: '#F6E8C8', textDark: true, use: 'Warning banners' },
    { token: '--danger', name: 'Danger', hex: '#B3261E', textDark: false, use: 'Exceeded limit, destructive actions' },
    { token: '--danger-tint', name: 'Danger Tint', hex: '#F8E1DE', textDark: true, use: 'Error and danger backgrounds' },
  ];

  const categories = [
    { name: 'Terracotta', tint: '#F3DCD2', ink: '#8A3A1F' },
    { name: 'Olive', tint: '#E8EBCF', ink: '#55601A' },
    { name: 'Teal', tint: '#D7ECE9', ink: '#1E5F58' },
    { name: 'Rose', tint: '#F5DCE3', ink: '#8A2A47' },
    { name: 'Sand', tint: '#EFE3CB', ink: '#7A5A12' },
    { name: 'Sky', tint: '#DCE8F5', ink: '#245A8C' },
    { name: 'Moss', tint: '#DDEBD9', ink: '#2F6A32' },
    { name: 'Slate', tint: '#E3E6EA', ink: '#3C4654' },
  ];

  const spacings = [
    { name: '1', px: 4, token: '--space-1' },
    { name: '2', px: 8, token: '--space-2' },
    { name: '3', px: 12, token: '--space-3' },
    { name: '4', px: 16, token: '--space-4' },
    { name: '6', px: 24, token: '--space-6' },
    { name: '8', px: 32, token: '--space-8' },
    { name: '12', px: 48, token: '--space-12' },
    { name: '16', px: 64, token: '--space-16' },
  ];

  const radii = [
    { name: 'Chip', value: '6px', token: '--radius-chip', className: 'rounded-chip' },
    { name: 'Button / Input', value: '10px', token: '--radius-btn', className: 'rounded-btn' },
    { name: 'Card / Modal', value: '16px', token: '--radius-card', className: 'rounded-card' },
    { name: 'Pill', value: '999px', token: '--radius-pill', className: 'rounded-pill' },
  ];

  const shadows = [
    { name: 'Shadow 1 (Resting Card)', token: '--shadow-1', value: '0 1px 2px rgba(60,40,20,.06), 0 1px 1px rgba(60,40,20,.04)', style: { boxShadow: 'var(--shadow-1)' } },
    { name: 'Shadow 2 (Hovered Card / Dropdown)', token: '--shadow-2', value: '0 4px 12px rgba(60,40,20,.08), 0 1px 2px rgba(60,40,20,.06)', style: { boxShadow: 'var(--shadow-2)' } },
    { name: 'Shadow 3 (Modal Dialog)', token: '--shadow-3', value: '0 16px 40px rgba(60,40,20,.14), 0 2px 6px rgba(60,40,20,.08)', style: { boxShadow: 'var(--shadow-3)' } },
  ];

  const durations = [
    { name: 'Fast', ms: 120, token: '--dur-fast', use: 'hover, press, color changes', dur: 'var(--dur-fast)' },
    { name: 'Base', ms: 200, token: '--dur-base', use: 'dropdowns, toasts, tab indicator', dur: 'var(--dur-base)' },
    { name: 'Slow', ms: 320, token: '--dur-slow', use: 'modals, section reveals', dur: 'var(--dur-slow)' },
    { name: 'Chart', ms: 600, token: '--dur-chart', use: 'chart entrance, progress fill', dur: 'var(--dur-chart)' },
  ];

  const easings = [
    { name: 'Standard', token: '--ease-standard', val: 'cubic-bezier(0.2, 0, 0, 1)', use: 'general movement', ease: 'var(--ease-standard)' },
    { name: 'Ease Out', token: '--ease-out', val: 'cubic-bezier(0.16, 1, 0.3, 1)', use: 'entrances (fade & rise)', ease: 'var(--ease-out)' },
    { name: 'Ease In', token: '--ease-in', val: 'cubic-bezier(0.4, 0, 1, 1)', use: 'exits (dismissal)', ease: 'var(--ease-in)' },
  ];

  return (
    <div
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        minHeight: '100vh',
        padding: '32px 24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-tint)', padding: '3px 8px', borderRadius: '4px' }}>
              Dev Preview Route
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', lineHeight: '36px', fontWeight: 600, marginTop: '8px', margin: '8px 0 0' }}>
              MoneyTracker Design Tokens & Foundations
            </h1>
            <p style={{ color: 'var(--ink-2)', fontSize: '14px', margin: '4px 0 0' }}>
              SPEC Sections 3, 4 & 7 · Excluded from production builds
            </p>
          </div>
          <a
            href="/"
            style={{
              padding: '8px 16px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line-strong)',
              borderRadius: 'var(--radius-btn)',
              color: 'var(--ink)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ← Back to App
          </a>
        </div>

        {/* Section 1: Colour Tokens */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600, marginBottom: '8px' }}>
            1. Core Colour Palette (SPEC Section 3)
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '20px' }}>
            Light, warm palette with one Cobalt accent. Text meets WCAG AA on surface backgrounds.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {colors.map((c) => (
              <div
                key={c.token}
                style={{
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-card)',
                  border: '1px solid var(--line)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-1)',
                }}
              >
                <div
                  style={{
                    backgroundColor: `var(${c.token})`,
                    height: '72px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: '8px 12px',
                    color: c.textDark ? '#1F1B16' : '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '14px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {c.hex}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{c.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--accent)', marginTop: '2px' }}>{c.token}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ink-2)', marginTop: '4px' }}>{c.use}</div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginTop: '28px', marginBottom: '12px' }}>
            Category Badges (8 Stable Tint & Ink Pairs)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {categories.map((cat) => (
              <div
                key={cat.name}
                style={{
                  backgroundColor: cat.tint,
                  color: cat.ink,
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-pill)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <span>{cat.name}</span>
                <span style={{ fontSize: '11px', opacity: 0.85, fontFamily: 'monospace' }}>{cat.ink}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2: Typography */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600, marginBottom: '8px' }}>
            2. Typography & Scale (SPEC Section 3)
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '20px' }}>
            Bricolage Grotesque (600) for hero and display; Instrument Sans (400, 500, 600) for UI and body. Tabular numbers for amounts and dates.
          </p>

          <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '20px', marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hero Figure (48px / 52px · Bricolage Grotesque 600)</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '48px', lineHeight: '52px', fontWeight: 600, color: 'var(--ink)', marginTop: '6px' }} className="tabular-nums">
                ₹1,25,000.00
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Page Title (28px / 36px · Bricolage Grotesque 600)</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '28px', lineHeight: '36px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                Monthly Transactions & Budget Analysis
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section Title (20px / 28px · Bricolage Grotesque 600)</span>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600, color: 'var(--ink)', marginTop: '4px' }}>
                Recent Spending Breakdown
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body (16px / 24px · Instrument Sans 400 / 500 / 600)</span>
              <div style={{ fontSize: '16px', lineHeight: '24px', color: 'var(--ink)', marginTop: '4px' }}>
                The redesign changes how MoneyTracker looks, moves and responds; it adds no features and changes no behavior. The direction is light and warm.
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body Small (14px / 20px · Instrument Sans)</span>
              <div style={{ fontSize: '14px', lineHeight: '20px', color: 'var(--ink-2)', marginTop: '4px' }}>
                Secondary text, table row metadata, filter labels, and auxiliary descriptions across all views.
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Caption (12px / 16px · Instrument Sans)</span>
              <div style={{ fontSize: '12px', lineHeight: '16px', color: 'var(--ink-3)', marginTop: '4px' }}>
                Microcopy, timestamp indicators, and table footnotes meeting 4.5:1 contrast requirements.
              </div>
            </div>

            <div>
              <span style={{ fontSize: '12px', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tabular Figures Verification (font-variant-numeric: tabular-nums)</span>
              <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-btn)', display: 'inline-block' }} className="tabular-nums">
                <div style={{ fontSize: '18px', fontWeight: 600 }}>111,111.11</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>888,888.88</div>
                <div style={{ fontSize: '14px', color: 'var(--income)', marginTop: '4px' }}>+₹84,250.00 (Income)</div>
                <div style={{ fontSize: '14px', color: 'var(--ink)' }}>-₹12,480.00 (Expense)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Spacing, Radius, and Depth */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600, marginBottom: '8px' }}>
            3. Spacing, Radius & Shadows (SPEC Section 3)
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '20px' }}>
            4px scale spacing, standardized border radii, warm-tinted shadows, and accessible focus rings.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            {/* Spacing */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>4px Spacing Scale</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {spacings.map((s) => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '48px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--ink-2)' }}>{s.px}px</span>
                    <div style={{ width: `${s.px}px`, height: '16px', backgroundColor: 'var(--accent)', borderRadius: '2px' }} />
                    <span style={{ fontSize: '12px', color: 'var(--ink-3)' }}>{s.token}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Radius Tokens</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {radii.map((r) => (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontFamily: 'monospace' }}>{r.token} ({r.value})</div>
                    </div>
                    <div
                      style={{
                        width: '54px',
                        height: '36px',
                        backgroundColor: 'var(--accent-tint)',
                        border: '1.5px solid var(--accent)',
                        borderRadius: `var(${r.token})`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows & Focus Ring */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Shadows & Focus Ring</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {shadows.map((sh) => (
                  <div
                    key={sh.token}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'var(--surface)',
                      borderRadius: 'var(--radius-btn)',
                      border: '1px solid var(--line)',
                      ...sh.style,
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{sh.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-3)', fontFamily: 'monospace' }}>{sh.token}</div>
                  </div>
                ))}
                <div style={{ marginTop: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Accessible Focus Ring</div>
                  <button
                    type="button"
                    style={{
                      padding: '8px 16px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--line-strong)',
                      borderRadius: 'var(--radius-btn)',
                      color: 'var(--ink)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    Tab onto me to test focus ring
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Motion Tokens & Interactive Demos */}
        <section style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600 }}>
                4. Motion System Tokens & Demos (SPEC Section 4)
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: '14px', margin: '4px 0 0' }}>
                Transitions restricted to transform and opacity. Hover effects inside @media (hover: hover).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlayAnim((p) => !p)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-btn)',
                fontSize: '14px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Trigger Animation Demos
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Duration Demos */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Duration Samples</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {durations.map((d) => (
                  <div key={d.token}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{d.name} ({d.ms}ms)</span>
                      <span style={{ color: 'var(--ink-3)', fontFamily: 'monospace' }}>{d.token}</span>
                    </div>
                    <div style={{ width: '100%', height: '28px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-chip)', position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: playAnim ? '100%' : '20%',
                          backgroundColor: 'var(--accent)',
                          borderRadius: 'var(--radius-chip)',
                          transitionProperty: 'width',
                          transitionDuration: d.dur,
                          transitionTimingFunction: 'var(--ease-standard)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '4px' }}>{d.use}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Easing Demos */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '20px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Easing Curve Samples</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {easings.map((e) => (
                  <div key={e.token}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{e.name}</span>
                      <span style={{ color: 'var(--ink-3)', fontFamily: 'monospace' }}>{e.token}</span>
                    </div>
                    <div style={{ width: '100%', height: '28px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-chip)', position: 'relative', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: playAnim ? '100%' : '20%',
                          backgroundColor: 'var(--income)',
                          borderRadius: 'var(--radius-chip)',
                          transitionProperty: 'width',
                          transitionDuration: 'var(--dur-slow)',
                          transitionTimingFunction: e.ease,
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ink-3)', marginTop: '4px' }}>{e.use} · {e.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Typed SVG Icon Showcase */}
        <section style={{ marginBottom: '48px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', lineHeight: '28px', fontWeight: 600, marginBottom: '8px' }}>
            5. Typed SVG Icon Components (Lucide Set, ISC Licence)
          </h2>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '20px' }}>
            Rendered with the shared Icon wrapper with size=20, strokeWidth=2, and aria-hidden=true.
          </p>

          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-card)',
              border: '1px solid var(--line)',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: '16px',
              boxShadow: 'var(--shadow-1)',
            }}
          >
            {Object.entries(Icons)
              .filter(([name]) => name.endsWith('Icon'))
              .map(([name, IconComponent]) => {
                const Component = IconComponent as React.ComponentType<{ size?: number; className?: string }>;
                return (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '12px 8px',
                      borderRadius: 'var(--radius-btn)',
                      border: '1px solid var(--line)',
                      backgroundColor: 'var(--bg)',
                    }}
                  >
                    <Component size={20} />
                    <span style={{ fontSize: '11px', color: 'var(--ink-2)', marginTop: '8px', textAlign: 'center', wordBreak: 'break-all' }}>
                      {name.replace('Icon', '')}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Section 6: Redesigned UI Primitives Showcase (Phase 2) */}
        <section style={{ marginBottom: '64px', borderTop: '2px solid var(--line)', paddingTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', lineHeight: '32px', fontWeight: 600 }}>
              6. Redesigned UI Primitives Showcase (SPEC Sections 3, 4, 5 & 7)
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--income)', background: 'var(--income-tint)', padding: '4px 10px', borderRadius: '999px' }}>
              Phase 2 Primitives
            </span>
          </div>
          <p style={{ color: 'var(--ink-2)', fontSize: '14px', marginBottom: '32px' }}>
            Interactive demonstration of every primitive in all states. Built in <code style={{ color: 'var(--accent)', fontWeight: 600 }}>src/components/ui/</code> with typed named exports.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* 1. Buttons */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>1. Button Primitives</h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: '13px' }}>
                    Primary (--accent), Secondary, Ghost, Danger (--danger). Sizes md (40px) and lg (44px). Width-locking loading spinner.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setBtnLoading((prev) => !prev)}
                >
                  {btnLoading ? 'Stop Loading' : 'Simulate Loading'}
                </Button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <Button variant="primary" size="md" loading={btnLoading}>
                  Primary Action
                </Button>
                <Button variant="secondary" size="md" loading={btnLoading}>
                  Secondary Action
                </Button>
                <Button variant="ghost" size="md" loading={btnLoading}>
                  Ghost Button
                </Button>
                <Button variant="danger" size="md" loading={btnLoading}>
                  Danger Action
                </Button>
                <Button variant="primary" size="md" disabled>
                  Disabled (45% Opacity)
                </Button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', width: '100%' }}>Sizes & Icons:</span>
                <Button variant="primary" size="lg" icon={<Icons.PlusIcon size={18} />}>
                  Large Primary (44px)
                </Button>
                <Button variant="secondary" size="lg" icon={<Icons.ArrowRightIcon size={18} />} iconPosition="right">
                  Large Secondary
                </Button>
                <Button variant="danger" size="md" icon={<Icons.TrashIcon size={16} />}>
                  Delete Item
                </Button>
                <Button variant="ghost" size="md" icon={<Icons.EditIcon size={16} />}>
                  Edit Record
                </Button>
              </div>
            </div>

            {/* 2. Text Input & Amount Input */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>2. TextInput & AmountInput</h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: '13px' }}>
                    Label above (never floating), error state with shake and message, ₹ prefix, live Indian grouping (1,25,000), inputmode decimal.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setTextErr((prev) => !prev)}
                  >
                    Toggle Text Error
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setAmountErr((prev) => !prev)}
                  >
                    Toggle Amount Error
                  </Button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Standard Text Input */}
                <TextInput
                  label="Description / Payee"
                  placeholder="e.g. Swiggy, Uber, Rent"
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  error={textErr ? 'Description must be at least 3 characters' : undefined}
                  helperText="Enter merchant or purpose of transaction"
                  leftAddon={<Icons.TagIcon size={18} />}
                />

                {/* Amount Input */}
                <AmountInput
                  label="Amount (Indian Grouping)"
                  value={amountVal}
                  onChange={(formatted) => setAmountVal(formatted)}
                  error={amountErr ? 'Amount cannot exceed ₹5,00,000' : undefined}
                  helperText="Supports live typing or pasting (e.g. 1,25,000 or 125000)"
                />

                {/* Disabled State Input */}
                <TextInput
                  label="Disabled Account Input"
                  value="HDFC Salary Account (Locked)"
                  disabled
                  helperText="Disabled input has 45% opacity and no focus"
                  leftAddon={<Icons.LockIcon size={18} />}
                />
              </div>
            </div>

            {/* 3. Segmented Control */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>3. SegmentedControl</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', marginBottom: '20px' }}>
                Sliding indicator via translateX, arrow-key navigation (Left/Right/Home/End), role radiogroup.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'center' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginBottom: '8px' }}>
                    Type Selector (Expense / Income):
                  </span>
                  <SegmentedControl
                    value={segmentedType}
                    onChange={setSegmentedType}
                    options={[
                      { value: 'expense', label: 'Expense', icon: <Icons.ArrowDownIcon size={16} /> },
                      { value: 'income', label: 'Income', icon: <Icons.ArrowUpIcon size={16} /> },
                    ]}
                  />
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginBottom: '8px' }}>
                    Date Preset Filter (3 Segments):
                  </span>
                  <SegmentedControl
                    value={segmentedPreset}
                    onChange={setSegmentedPreset}
                    options={[
                      { value: 'week', label: 'This Week' },
                      { value: 'month', label: 'This Month' },
                      { value: '30d', label: 'Last 30 Days' },
                    ]}
                  />
                </div>

                <div>
                  <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginBottom: '8px' }}>
                    Disabled SegmentedControl:
                  </span>
                  <SegmentedControl
                    value="all"
                    disabled
                    onChange={() => {}}
                    options={[
                      { value: 'all', label: 'All Accounts' },
                      { value: 'bank', label: 'Bank Only' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* 4. Dropdown & Pickers */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>4. Dropdown, DatePicker & DayOfMonthPicker</h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: '13px' }}>
                    Replacing custom selector look: 40px options with check, 180° rotating chevron, open upward detection, month slide, today dot, and filled-circle selection.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setDropdownErr((prev) => !prev)}
                >
                  Toggle Dropdown Error
                </Button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                {/* Category Dropdown */}
                <Dropdown
                  label="Category Selection"
                  value={dropdownVal}
                  onChange={setDropdownVal}
                  hasError={dropdownErr}
                  errorMessage={dropdownErr ? 'Please select a valid category' : undefined}
                  options={[
                    { value: 'groceries', label: 'Groceries', icon: <Icons.ShoppingCartIcon size={16} /> },
                    { value: 'dining', label: 'Dining Out', icon: <Icons.UtensilsIcon size={16} /> },
                    { value: 'entertainment', label: 'Entertainment', icon: <Icons.FilmIcon size={16} /> },
                    { value: 'utilities', label: 'Utilities & Bills', icon: <Icons.ZapIcon size={16} /> },
                    { value: 'transport', label: 'Transport & Fuel', icon: <Icons.CarIcon size={16} /> },
                    { value: 'health', label: 'Health & Medical', icon: <Icons.HeartPulseIcon size={16} /> },
                  ]}
                />

                {/* DatePicker */}
                <DatePicker
                  label="Transaction Date"
                  value={dateVal}
                  onChange={setDateVal}
                />

                {/* DayOfMonthPicker (Autopay) */}
                <DayOfMonthPicker
                  label="Autopay Deduction Day"
                  value={autopayDayVal}
                  onChange={setAutopayDayVal}
                />
              </div>
            </div>

            {/* 5. Cards & Badges */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>5. Card & Badge Primitives</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', marginBottom: '20px' }}>
                Static vs interactive cards (hover -2px elevation), and category badge color pairs assigned by deterministic hash (SPEC Section 3).
              </p>

              {/* Cards row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <Card>
                  <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-3)' }}>Static Card</span>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, marginTop: '6px' }}>₹1,25,000</div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-2)', marginTop: '4px' }}>Does not move or elevate on hover (preserves layout stability).</p>
                </Card>

                <Card interactive onClick={() => alert('Interactive card clicked!')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--accent)' }}>Interactive Card</span>
                    <Icons.ArrowRightIcon size={16} className="text-accent" />
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 600, marginTop: '6px' }}>Click to Inspect</div>
                  <p style={{ fontSize: '13px', color: 'var(--ink-2)', marginTop: '4px' }}>Hover lifts 2px and elevates shadow from shadow-1 to shadow-2.</p>
                </Card>
              </div>

              {/* Badges showcase */}
              <div>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginBottom: '12px' }}>
                  Stable Category Hash Badges (8 SPEC Palettes):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  <Badge category="Groceries" />
                  <Badge category="Dining Out" />
                  <Badge category="Electronics" />
                  <Badge category="Healthcare" />
                  <Badge category="Education" />
                  <Badge category="Travel" />
                  <Badge category="Investments" />
                  <Badge category="Entertainment" />
                </div>

                <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', marginBottom: '12px' }}>
                  System Semantic Badges:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <Badge variant="income" icon={<Icons.TrendingUpIcon size={14} />}>+₹45,000 Received</Badge>
                  <Badge variant="warning" icon={<Icons.AlertTriangleIcon size={14} />}>80% Limit Reached</Badge>
                  <Badge variant="danger" icon={<Icons.AlertCircleIcon size={14} />}>Over Budget Limit</Badge>
                  <Badge variant="accent">Current Plan</Badge>
                  <Badge variant="neutral">Archived</Badge>
                </div>
              </div>
            </div>

            {/* 6. Progress Bar */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600 }}>6. ProgressBar Primitive</h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: '13px' }}>
                    8px track, scaleX fill (600ms), threshold tick mark, and three-colour behavior (--accent below, --warning at threshold, --danger over limit).
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-2)' }}>Adjust: {progressVal}%</span>
                  <input
                    type="range"
                    min="10"
                    max="130"
                    value={progressVal}
                    onChange={(e) => setProgressVal(Number(e.target.value))}
                    style={{ width: '120px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: '6px' }}>
                    Interactive Dynamic Progress:
                  </span>
                  <ProgressBar
                    value={progressVal * 500}
                    max={50000}
                    threshold={0.8}
                    showLabel
                    label="Monthly Discretionary Budget"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: '1px solid var(--line)' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      State 1: Normal (&lt; 80%)
                    </span>
                    <ProgressBar value={22000} max={50000} threshold={0.8} showLabel label="Dining Out" />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--warning)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      State 2: At Threshold (80% - 100%)
                    </span>
                    <ProgressBar value={42500} max={50000} threshold={0.8} showLabel label="Shopping" />
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      State 3: Over Limit (&gt; 100%)
                    </span>
                    <ProgressBar value={58000} max={50000} threshold={0.8} showLabel label="Entertainment" />
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Skeleton & Reduced Motion */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>7. Skeleton Primitive</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', marginBottom: '20px' }}>
                Surface-2 blocks with warm shimmer sweep (1.4s linear repeating). Shimmer automatically halts under prefers-reduced-motion.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Card Skeleton */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)' }}>Card Layout Skeleton:</span>
                  <div style={{ padding: '16px', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Skeleton variant="circular" width={40} height={40} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <Skeleton variant="text" width="60%" height={14} />
                        <Skeleton variant="text" width="40%" height={12} />
                      </div>
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={24} />
                    <Skeleton variant="text" width="80%" height={12} />
                  </div>
                </div>

                {/* Table Row Skeleton */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)' }}>Transaction Row Skeleton:</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[1, 2, 3].map((n) => (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: 'var(--radius-btn)', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '60%' }}>
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="text" width="70%" height={14} />
                        </div>
                        <Skeleton variant="text" width="60px" height={16} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 8. Banner & EmptyState */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>8. Banner & EmptyState</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', marginBottom: '20px' }}>
                Anomaly banner (warning surface, 4px edge, Approve & Dismiss) and warm Haikei-style EmptyState.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
                {/* Warning Anomaly Banner */}
                <Banner
                  variant="warning"
                  title="Unusual Expense Detected"
                  message="₹14,500 charged under Electronics (3.2x higher than your 3-month median)."
                  actions={
                    <>
                      <Button variant="secondary" size="md" onClick={() => alert('Approved')}>
                        Approve
                      </Button>
                      <Button variant="ghost" size="md" className="text-danger hover:bg-danger-tint" onClick={() => alert('Dismissed')}>
                        Dismiss
                      </Button>
                    </>
                  }
                />

                {/* Info & Danger Banners */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <Banner
                    variant="info"
                    title="Offline Sync Active"
                    message="2 transactions pending sync when connectivity resumes."
                    onDismiss={() => alert('Banner dismissed')}
                  />
                  <Banner
                    variant="danger"
                    title="Budget Exceeded"
                    message="Entertainment has exceeded monthly limit by ₹2,400."
                  />
                </div>
              </div>

              {/* EmptyState */}
              <div style={{ paddingTop: '20px', borderTop: '1px solid var(--line)' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-3)', display: 'block', marginBottom: '16px' }}>
                  EmptyState Component:
                </span>
                <EmptyState
                  title="No transactions found"
                  description="You have no expenses or income recorded for this period. Add your first transaction to start tracking."
                  action={
                    <Button variant="primary" size="md" icon={<Icons.PlusIcon size={16} />}>
                      Add Transaction
                    </Button>
                  }
                />
              </div>
            </div>

            {/* 9. Toasts & Confirm Dialogs */}
            <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-card)', border: '1px solid var(--line)', padding: '24px', boxShadow: 'var(--shadow-1)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>9. Toast & ConfirmDialog System</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: '13px', marginBottom: '20px' }}>
                Timer bar (scaleX 1 to 0), pauses on hover and keyboard focus, stacks max 3 with 8px gaps, Escape key closes, and focus trapping.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                <Button variant="secondary" size="md" onClick={() => triggerToast('success')}>
                  Trigger Success Toast
                </Button>
                <Button variant="secondary" size="md" onClick={() => triggerToast('error')}>
                  Trigger Error Toast
                </Button>
                <Button variant="secondary" size="md" onClick={() => triggerToast('warning')}>
                  Trigger Warning Toast
                </Button>
                <Button variant="secondary" size="md" onClick={() => triggerToast('info')}>
                  Trigger Info Toast
                </Button>

                <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--line)' }} />

                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      variant: 'primary',
                      title: 'Save Budget Changes?',
                      message: 'This will update your monthly budget limit to ₹50,000 across all devices.',
                    })
                  }
                >
                  Open Safe Confirm
                </Button>

                <Button
                  variant="danger"
                  size="md"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      variant: 'danger',
                      title: 'Delete Autopay Plan?',
                      message: 'Are you sure you want to delete Netflix autopay? This action cannot be undone.',
                    })
                  }
                >
                  Open Destructive Confirm
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Global Toast Container UI */}
        <ToastContainerUI toasts={toasts} onDismiss={dismissToast} />

        {/* Global Confirm Dialog UI */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmText={confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
          cancelText="Cancel"
          onConfirm={() => {
            alert('Confirmed action!');
            setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          }}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}

export default DesignSystemDevPage;
