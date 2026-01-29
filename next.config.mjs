/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora erros de linter (avisos amarelos) durante o build na Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de TypeScript durante o build na Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;