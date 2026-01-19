/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignora erros de lint (aquelas linhas vermelhas) na hora de subir
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignora erros de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;