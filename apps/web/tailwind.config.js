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
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          2: 'var(--ink-2)',
          3: 'var(--ink-3)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          tint: 'var(--accent-tint)',
        },
        income: {
          DEFAULT: 'var(--income)',
          tint: 'var(--income-tint)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          tint: 'var(--warning-tint)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          tint: 'var(--danger-tint)',
        },
        // Category badge tints
        cat: {
          'terracotta-bg': '#F3DCD2',
          'terracotta-ink': '#8A3A1F',
          'olive-bg': '#E8EBCF',
          'olive-ink': '#55601A',
          'teal-bg': '#D7ECE9',
          'teal-ink': '#1E5F58',
          'rose-bg': '#F5DCE3',
          'rose-ink': '#8A2A47',
          'sand-bg': '#EFE3CB',
          'sand-ink': '#7A5A12',
          'sky-bg': '#DCE8F5',
          'sky-ink': '#245A8C',
          'moss-bg': '#DDEBD9',
          'moss-ink': '#2F6A32',
          'slate-bg': '#E3E6EA',
          'slate-ink': '#3C4654',
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        sans: ['"Instrument Sans"', 'sans-serif'],
      },
      fontSize: {
        'caption': ['12px', '16px'],
        'body-sm': ['14px', '20px'],
        'body': ['16px', '24px'],
        'section-title': ['20px', '28px'],
        'page-title': ['28px', '36px'],
        'hero': ['48px', '52px'],
        'hero-mobile': ['36px', '40px'],
      },
      borderRadius: {
        'chip': '6px',
        'btn': '10px',
        'card': '16px',
      },
      boxShadow: {
        'warm-1': 'var(--shadow-1)',
        'warm-2': 'var(--shadow-2)',
        'warm-3': 'var(--shadow-3)',
      },
      transitionDuration: {
        'fast': 'var(--dur-fast)',
        'base': 'var(--dur-base)',
        'slow': 'var(--dur-slow)',
        'chart': 'var(--dur-chart)',
      },
      transitionTimingFunction: {
        'standard': 'var(--ease-standard)',
        'out': 'var(--ease-out)',
        'in': 'var(--ease-in)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-4px)' },
          '40%, 80%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake: 'shake 240ms ease-in-out',
        shimmer: 'shimmer 1.4s linear infinite',
        fadeIn: 'fadeIn var(--dur-slow) var(--ease-out)',
      },
    },
  },
  plugins: [],
};
