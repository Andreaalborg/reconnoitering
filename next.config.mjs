/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Ignoring TypeScript errors during the build process
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
  // Turn off output export which requires static parameters
  output: 'standalone',
  // Use experimental options that work with Next.js 15
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    }
  }
};

export default nextConfig;