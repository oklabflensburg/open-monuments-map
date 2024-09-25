/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/*.{html,js}'],
  theme: {
    extend: {
      zIndex: {
        '1200': '1200',
        '1300': '1300'
      }
    }
  },
  plugins: [],
}
