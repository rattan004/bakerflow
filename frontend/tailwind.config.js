/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bakery: {
          dark: "#1A1B1E",
          cream: "#F9F7F2",
          accent: "#E6A04D",
          brown: "#4A3728",
          card: "#FFFFFF",
        }
      },
      fontFamily: {
        handwritten: ['"Dancing Script"', 'cursive'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}