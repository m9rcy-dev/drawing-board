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
        atelier: {
          bg: "#0B0A14",
          surface: "#15141F",
          elevated: "#1D1C2A",
          border: "rgba(255, 255, 255, 0.07)",
          canvas: "#FAF9F6",
          accent: "#8B5CF6",
          "accent-dim": "rgba(139, 92, 246, 0.15)",
          "accent-glow": "rgba(139, 92, 246, 0.35)",
          amber: "#F59E0B",
          text: "#EAE8F5",
          muted: "#6B6884",
          subtle: "#2A2838",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      boxShadow: {
        glass: "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        "tool-active": "0 0 0 2px rgba(139,92,246,0.6), 0 4px 16px rgba(139,92,246,0.25)",
        canvas: "inset 0 0 80px rgba(0,0,0,0.12)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "tool-pop": {
          "0%": { transform: "scale(0.92)" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 12px rgba(139,92,246,0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(139,92,246,0.6)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "tool-pop": "tool-pop 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
