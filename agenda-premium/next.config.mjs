/** @type {import('next').NextConfig} */
const nextConfig = {
  // Se o site abrir em branco, tente remover a linha do basePath abaixo
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;