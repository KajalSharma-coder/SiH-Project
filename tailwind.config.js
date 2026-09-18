/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "#B96832",
        leaf: "#555633",
        cream: "#F4EFE4",
        wheat: "#E9E1D2",
        ink: "#33291F",
        bark: "#765536"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(51, 41, 31, 0.10)"
      }
    }
  },
  plugins: []
};
