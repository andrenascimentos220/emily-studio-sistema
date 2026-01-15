/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignora erros de TypeScript no build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignora erros do ESLint no build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;