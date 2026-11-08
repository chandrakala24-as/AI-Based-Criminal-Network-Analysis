/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0F19',
          800: '#111827',
          700: '#1F2937',
          600: '#374151',
        },
        brand: {
          blue: '#0284C7',
          cyan: '#06B6D4',
          indigo: '#6366F1',
          amber: '#F59E0B',
          rose: '#F43F5E',
          emerald: '#10B981',
        }
      }
    },
  },
  plugins: [],
}
