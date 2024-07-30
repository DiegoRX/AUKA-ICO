/** @type {import('next').NextConfig} */
module.exports = {
  env:{
    API_CM: process.env.API_CM,
    ONDK_PRIVATE_KEY: process.env.ONDK_PRIVATE_KEY,
    AUKA_PRIVATE_KEY: process.env.AUKA_PRIVATE_KEY,
    USDT_PRIVATE_KEY: process.env.USDT_PRIVATE_KEY,
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