/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg-rgb) / <alpha-value>)',
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        'surface-alt': 'rgb(var(--color-surface-alt-rgb) / <alpha-value>)',
        border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
        ink: 'rgb(var(--color-text-rgb) / <alpha-value>)',
        muted: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
        neon: 'rgb(var(--color-neon-rgb) / <alpha-value>)',
        cyan: 'rgb(var(--color-cyan-rgb) / <alpha-value>)',
        violet: 'rgb(var(--color-violet-rgb) / <alpha-value>)',
        danger: 'rgb(var(--color-danger-rgb) / <alpha-value>)',
        warning: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 0 1px rgba(57,255,136,0.35), 0 0 24px rgba(57,255,136,0.15)',
        card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
}
