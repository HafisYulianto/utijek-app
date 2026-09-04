import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "uti-maroon": {
          DEFAULT: "#7B1113",
          50: "#FDF2F2",
          100: "#FAE0E0",
          200: "#F5BDBD",
          300: "#ED8E8F",
          400: "#E15859",
          500: "#CE2628",
          600: "#A81A1C",
          700: "#7B1113",
          800: "#5E0D0E",
          900: "#430A0B",
          950: "#2A0607",
        },
        "uti-gold": "#F5A623",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "pulse-ring": "pulseRing 1.5s ease-out infinite",
        "bounce-in": "bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseRing: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        bounceIn: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      backgroundImage: {
        "maroon-gradient":
          "linear-gradient(135deg, #7B1113 0%, #A81A1C 50%, #5E0D0E 100%)",
        "maroon-light":
          "linear-gradient(180deg, #7B1113 0%, #9B1517 100%)",
      },
      boxShadow: {
        maroon: "0 4px 24px rgba(123, 17, 19, 0.3)",
        "maroon-lg": "0 8px 40px rgba(123, 17, 19, 0.4)",
        card: "0 2px 16px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
