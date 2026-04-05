/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './App.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        'display': ['Orbitron-Regular'],
        'display-bold': ['Orbitron-Bold'],
      },
      colors: {
        steel: {
          50: '#F4F5F6',
          100: '#E8EAEC',
          200: '#D1D4D9',
          300: '#B0B5BC',
          400: '#8A919A',
          500: '#6B737E',
          600: '#565D66',
          700: '#464C53',
          800: '#3C4147',
          900: '#35393E',
          950: '#1A1C1F',
        },
      },
    },
  },
  plugins: [],
};
