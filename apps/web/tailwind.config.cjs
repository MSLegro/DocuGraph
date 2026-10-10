/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          base: 'rgb(var(--color-bg-base) / <alpha-value>)',
          card: 'rgb(var(--color-bg-card) / <alpha-value>)',
          border: 'rgb(var(--color-border) / <alpha-value>)',
          hover: 'rgb(var(--color-bg-hover) / <alpha-value>)',
          muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
          text: 'rgb(var(--color-text-main) / <alpha-value>)'
        },
        brand: {
          primary: '#6366F1',
          hover: '#4F46E5',
          cyan: '#06B6D4',
          accent: '#7C3AED',
          glow: '#818CF8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
