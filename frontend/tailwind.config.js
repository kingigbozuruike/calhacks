/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['"Fredoka"', 'sans-serif'],
      },
      colors: {
        'thistle': '#CDB4DB',
        'fairy-tale': '#FFC8DD',
        'carnation-pink': '#FFAFCC',
        'uranian-blue': '#BDE0FE',
        'light-sky-blue': '#A2D2FF',
      },
    },
  },
  plugins: [],
}

