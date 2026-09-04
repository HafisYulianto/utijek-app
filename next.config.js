/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "mapbox-cache",
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
});

const nextConfig = {
  reactStrictMode: true,

  // Use remotePatterns instead of deprecated domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      // Supabase Storage avatars
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // Silence Turbopack warning — no custom webpack config needed
  turbopack: {},
};

module.exports = withPWA(nextConfig);
