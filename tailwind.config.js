/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@luridlf/prisma-ui-lib/dist/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "on-primary-container": "#595f34",
        "surface-tint": "#5c6236",
        "surface-container-high": "#f8e6c6",
        "secondary-fixed-dim": "#e4c526",
        "inverse-on-surface": "#ffefd3",
        "surface-container": "#feeccb",
        "tertiary-fixed-dim": "#ffb954",
        "on-tertiary-container": "#7f5200",
        "on-primary": "#ffffff",
        "tertiary": "#835500",
        "secondary-container": "#fedf41",
        "primary-fixed-dim": "#c4cb96",
        "on-error": "#ffffff",
        "primary": "#5c6236",
        "tertiary-fixed": "#ffddb4",
        "surface-container-lowest": "#ffffff",
        "outline-variant": "#c8c7b9",
        "background": "#fff8f2",
        "on-background": "#231a07",
        "on-surface-variant": "#47483d",
        "secondary": "#6e5e00",
        "error": "#ba1a1a",
        "primary-fixed": "#e0e7b0",
        "surface-dim": "#ead8b8",
        "surface": "#fff8f2",
        "error-container": "#ffdad6",
        "inverse-primary": "#c4cb96",
        "secondary-fixed": "#ffe259",
        "on-tertiary": "#ffffff",
        "on-tertiary-fixed": "#291800",
        "on-secondary": "#ffffff",
        "outline": "#78786b",
        "on-surface": "#231a07",
        "on-tertiary-fixed-variant": "#633f00",
        "on-secondary-container": "#736200",
        "on-primary-fixed": "#191e00",
        "surface-bright": "#fff8f2",
        "surface-variant": "#f2e0c0",
        "surface-container-highest": "#f2e0c0",
        "on-secondary-fixed": "#211b00",
        "surface-container-low": "#fff2de",
        "on-primary-fixed-variant": "#444a21",
        "inverse-surface": "#392f19",
        "primary-container": "#d2d9a3",
        "on-secondary-fixed-variant": "#534600",
        "tertiary-container": "#ffcb87",
        "on-error-container": "#93000a"
      },
      borderRadius: {
        "DEFAULT": "1rem",
        "lg": "2rem",
        "xl": "3rem",
        "full": "9999px"
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [],
}
