/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      '@supabase/supabase-js',
      '@supabase/ssr',
      'sonner',
    ],
  },
};

export default nextConfig;
