/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  turbopack: {}
}

module.exports = nextConfig
