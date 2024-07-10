/** @type {import('next').NextConfig} */
module.exports = {
  env:{
    API_CM: process.env.API_CM,
  },
    images: {
      formats: ['image/avif', 'image/webp'],
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '*',
          port: '',
          pathname: '/**',
        },
      ],
    },
  }