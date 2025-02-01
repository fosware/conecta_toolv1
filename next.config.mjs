/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Temporalmente ignoramos errores de ESLint durante la construcción
  },
  typescript: {
    ignoreBuildErrors: true, // Temporalmente ignoramos errores de TypeScript durante la construcción
  },
  output: 'standalone',
  experimental: {
  }
};

export default nextConfig;
