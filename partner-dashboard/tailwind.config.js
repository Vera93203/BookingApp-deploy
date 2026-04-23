/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#003580', light: '#0057B8', dark: '#00224F' },
        accent: '#FEBA02',
      },
    },
  },
  plugins: [],
};
