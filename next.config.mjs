/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/word-connect-game',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
