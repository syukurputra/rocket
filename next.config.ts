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
        // Landing kini di root; arahkan URL lama /landing ke /
        source: '/landing',
        destination: '/',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
