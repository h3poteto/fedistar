/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config.js')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true
  },
  i18n,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.net = false
      config.resolve.fallback.dns = false
      config.resolve.fallback.tls = false
      config.resolve.fallback.zlib = false
      config.resolve.fallback.bufferutil = false
      config.resolve.fallback['utf-8-validate'] = false
    }
    return config
  }
}

module.exports = nextConfig
