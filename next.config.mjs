/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server Actions are stable in Next 14 but we keep body size generous for image uploads later.
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      // Supabase Storage public bucket
      { protocol: "https", hostname: "*.supabase.co" },
      // Placeholder / stock imagery used by the seed data
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
