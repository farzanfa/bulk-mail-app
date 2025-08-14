/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  redirects: async () => ([
    {
      source: '/contacts',
      destination: '/uploads',
      permanent: true
    }
  ])
};

export default nextConfig;


