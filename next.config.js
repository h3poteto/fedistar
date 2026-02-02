/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: false,
  images: {
    unoptimized: true
  },
  turbopack: {}
}

module.exports = nextConfig
