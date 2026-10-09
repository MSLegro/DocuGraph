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
          base: '#12131C',
          card: '#1A1B26',
          border: '#2A2C3F',
          hover: '#232536',
          muted: '#8B90A5',
          text: '#F1F3F9'
        },
        brand: {
          primary: '#6366F1',
          hover: '#4F46E5',
          cyan: '#06B6D4',
          accent: '#7C3AED'
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
