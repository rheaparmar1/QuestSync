/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        uw: {
          gold: '#FFD700',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
}