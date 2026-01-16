import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  output: 'standalone',
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/h',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
