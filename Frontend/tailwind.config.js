// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#3be3d2",
        "background-light": "#f6f8f8",
        "background-dark": "#11211f",
        "surface-light": "#ffffff",
        "surface-dark": "#1a2c2a",
        "text-light": "#111717",
        "text-dark": "#e8f3f1",
        "text-muted-light": "#648783",
        "text-muted-dark": "#93b0ad",
        "border-light": "#dce5e4",
        "border-dark": "#304d49",
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [], // keep empty unless you install additional tailwind plugins
};
