/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#0f172a', // Azul marino más oscuro y menos saturado
        'dark-blue-light': '#1e293b',
        'accent-green': '#10b981',
        'accent-green-dark': '#059669',
      },
    },
  },
  plugins: [],
}

