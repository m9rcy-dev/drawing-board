/** @type {import('postcss').Config} */
const config = {
  plugins: {
    // Tailwind v4 ships its own PostCSS plugin — no autoprefixer needed.
    "@tailwindcss/postcss": {},
  },
};

export default config;
