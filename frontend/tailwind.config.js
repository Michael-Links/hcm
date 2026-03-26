/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef8fd',
          100: '#d7eef8',
          200: '#b1ddf1',
          300: '#84c7e6',
          400: '#58b0da',
          500: '#3798cf',
          600: '#287ab4',
          700: '#22618f',
          800: '#224f74',
          900: '#214463',
        },
      },
    },
  },
  plugins: [],
};
