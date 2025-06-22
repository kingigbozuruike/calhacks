/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'thistle': '#cdb4db',
        'fairy-tale': '#ffc8dd',
        'carnation-pink': '#ffafcc',
        'uranian-blue': '#bde0fe',
        'light-sky-blue': '#a2d2ff',
      }
    },
  },
  plugins: [],
}

