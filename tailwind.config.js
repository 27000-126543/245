/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#f0f4f8",
          100: "#d9e2ec",
          200: "#bcccdc",
          300: "#9fb3c8",
          400: "#829ab1",
          500: "#627d98",
          600: "#486581",
          700: "#334e68",
          800: "#1e3a5f",
          900: "#102a43",
        },
        gold: {
          50: "#fdf8e7",
          100: "#faf0c8",
          200: "#f3e08f",
          300: "#ebce57",
          400: "#e2be30",
          500: "#c9a962",
          600: "#a98a4a",
          700: "#8a6e38",
          800: "#6b5328",
          900: "#4c3a1b",
        },
      },
      fontFamily: {
        sans: [
          "Noto Sans SC",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        serif: [
          "Noto Serif SC",
          "Georgia",
          "serif",
        ],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "fade-in": "fadeIn 0.3s ease-out",
        "count-up": "countUp 0.5s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        countUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
