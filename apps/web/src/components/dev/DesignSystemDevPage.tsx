import React, { useState } from 'react';
import * as Icons from '../icons';

export function DesignSystemDevPage() {
  const [playAnim, setPlayAnim] = useState(false);

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
      </div>
    </div>
  );
}

export default DesignSystemDevPage;
