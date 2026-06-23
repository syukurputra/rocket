import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.nevaobjects.id',
        pathname: '/**'
      }
    ]
  },
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/landing',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
