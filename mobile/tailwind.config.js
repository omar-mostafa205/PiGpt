/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Mirrors src/constants/colors.ts so styled-components and Tailwind
      // classes resolve to the same palette.
      colors: {
        background: "#f5f5f5",
        surface: "#ffffff",
        "surface-secondary": "#f8f9fb",

        primary: "#4a90e2",
        "primary-hover": "#357abd",
        "primary-light": "#dbeafe",

        "text-primary": "#111827",
        "text-secondary": "#4b5563",
        "text-muted": "#6b7280",

        "border-light": "#e5e7eb",
        "border-medium": "#d1d5db",

        math: "#4a90e2",
        "math-light": "#dbeafe",
        physics: "#7c3aed",
        "physics-light": "#ede9fe",
        chemistry: "#059669",
        "chemistry-light": "#d1fae5",
        accounting: "#d97706",
        "accounting-light": "#fef3c7",

        success: "#10b981",
        "success-light": "#d1fae5",
        error: "#ef4444",
        "error-light": "#fee2e2",
        warning: "#f59e0b",
        "warning-light": "#fef3c7",

        streak: "#f97316",
        "streak-light": "#ffedd5",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
