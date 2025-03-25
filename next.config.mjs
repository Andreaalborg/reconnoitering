/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'picsum.photos',
      'artsandculture.google.com',
      'images.unsplash.com',
      'upload.wikimedia.org'
    ],
  },
  serverExternalPackages: ['bcrypt']
};

export default nextConfig;