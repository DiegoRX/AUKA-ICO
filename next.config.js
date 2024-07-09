/** @type {import('next').NextConfig} */
module.exports = {
  env:{
    
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