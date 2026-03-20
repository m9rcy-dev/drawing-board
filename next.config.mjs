/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate a fully static site in /out — required for GitHub Pages and any CDN deployment.
  output: "export",

  // Set to "/your-repo-name" when deploying to GitHub Pages (username.github.io/repo-name).
  // Leave empty ("") for a root domain deployment (e.g. Vercel, Netlify, custom domain).
  // Configure via environment variable so the same codebase works everywhere:
  //   NEXT_PUBLIC_BASE_PATH=/drawing-board npm run build
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",

  // Required for static export: Next.js image optimisation needs a server.
  images: {
    unoptimized: true,
  },

  // Ensures each route generates an index.html file, which GitHub Pages expects.
  trailingSlash: true,
};

export default nextConfig;
