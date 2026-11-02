/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-3': 'var(--ink-3)',
        accent: 'var(--accent)',
        'accent-tint': 'var(--accent-tint)',
        income: 'var(--income)',
        'income-tint': 'var(--income-tint)',
        warning: 'var(--warning)',
        'warning-tint': 'var(--warning-tint)',
        danger: 'var(--danger)',
        'danger-tint': 'var(--danger-tint)',
        // Category Badges (SPEC Section 3)
        'cat-terracotta': {
          tint: 'var(--cat-terracotta-tint)',
          ink: 'var(--cat-terracotta-ink)',
        },
        'cat-olive': {
          tint: 'var(--cat-olive-tint)',
          ink: 'var(--cat-olive-ink)',
        },
        'cat-teal': {
          tint: 'var(--cat-teal-tint)',
          ink: 'var(--cat-teal-ink)',
        },
        'cat-rose': {
          tint: 'var(--cat-rose-tint)',
          ink: 'var(--cat-rose-ink)',
        },
        'cat-sand': {
          tint: 'var(--cat-sand-tint)',
          ink: 'var(--cat-sand-ink)',
        },
        'cat-sky': {
          tint: 'var(--cat-sky-tint)',
          ink: 'var(--cat-sky-ink)',
        },
        'cat-moss': {
          tint: 'var(--cat-moss-tint)',
          ink: 'var(--cat-moss-ink)',
        },
        'cat-slate': {
          tint: 'var(--cat-slate-tint)',
          ink: 'var(--cat-slate-ink)',
        },
      },
      borderRadius: {
        chip: 'var(--radius-chip)',
        input: 'var(--radius-input)',
        btn: 'var(--radius-btn)',
        card: 'var(--radius-card)',
        modal: 'var(--radius-modal)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        '1': 'var(--shadow-1)',
        '2': 'var(--shadow-2)',
        '3': 'var(--shadow-3)',
        focus: 'var(--focus-ring)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
        chart: 'var(--dur-chart)',
      },
      transitionTimingFunction: {
        standard: 'var(--ease-standard)',
        out: 'var(--ease-out)',
        in: 'var(--ease-in)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        rail: 'var(--nav-rail-width)',
        gutter: 'var(--gutter-desktop)',
        'gutter-mobile': 'var(--gutter-mobile)',
      },
      maxWidth: {
        content: 'var(--content-max-width)',
      },
      animation: {
        blob: "blob 7s infinite",
        fadeInUp: "fadeInUp 0.6s ease-out",
        shake: "shake 0.5s ease-in-out",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-5px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(5px)" },
        },
      },
    },
  },
  plugins: [],
};
