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

