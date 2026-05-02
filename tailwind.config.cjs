/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");

module.exports = withMT({
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        arsci: {
          navy: '#0f0f3d',
          'navy-light': '#1a1a5e',
          'navy-mid': '#141450',
          'navy-dark': '#0a0a2e',
          pink: '#e054c0',
          'pink-light': '#f078d8',
          'pink-dark': '#c040a0',
          cyan: '#4cf0d0',
          'cyan-light': '#7af5e0',
          'cyan-dark': '#30c8a8',
          purple: '#9b8ec8',
          'purple-light': '#b8aed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
});
