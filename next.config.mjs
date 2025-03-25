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
  serverExternalPackages: ['bcrypt'],
  // Disable static exports that could cause problems
  output: 'standalone',
  // Disable the React Server Components strict mode which helps with Suspense
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;