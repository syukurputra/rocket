import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  basePath: process.env.BASEPATH,
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/h/landing-page',
        permanent: true,
        locale: false
      },
      {
        source: '/id',
        destination: '/id/home',
        permanent: true,
        locale: false
      }
    ]
  }
}

export default nextConfig
