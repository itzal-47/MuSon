/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#D97706',
          light: '#F59E0B',
          vibrante: '#EA580C',
          dark: '#B45309',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
