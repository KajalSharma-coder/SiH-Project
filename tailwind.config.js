/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "#2f7d4d",
        leaf: "#57a773",
        cream: "#f6f1e7",
        wheat: "#e9d8a6",
        ink: "#17312a",
        skyline: "#2e7da7"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 49, 42, 0.10)"
      }
    }
  },
  plugins: []
};
