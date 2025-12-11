/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['seijgrobmpqctjripvaiu.supabase.co'],
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
