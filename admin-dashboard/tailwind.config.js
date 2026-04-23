/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1e293b', light: '#334155', dark: '#0f172a' },
        accent: { DEFAULT: '#6366f1', light: '#818cf8' },
      },
    },
  },
  plugins: [],
};
