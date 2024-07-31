/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryBG: '#244D59',
        secondaryBG: '#57BAD9',
        darkBG: '#4DA4BF',
        letraDark: '#FFFFFF',
        letraLight: '#000000',
      },
      screens: {
        'max-sm': { 'max': '420px' }, // Pantallas con ancho máximo de 639px
        'max-md': { 'max': '767px' }, // Pantallas con ancho máximo de 767px
        'max-lg': { 'max': '1023px' }, // Pantallas con ancho máximo de 1023px
        'max-xl': { 'max': '1279px' }, // Pantallas con ancho máximo de 1279px
      },
      fontFamily: { roboto: ['Roboto', 'sans-serif', 'sans']},
      keyframes: {
        spin: {
          '0%, 50%': { transform: 'rotate(600deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}

