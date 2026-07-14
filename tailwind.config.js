/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e3a8a',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#172554',
        },
        secondary: {
          DEFAULT: '#60a5fa',
          100: '#dbeafe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
        },
        accent: {
          DEFAULT: '#f97316',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
