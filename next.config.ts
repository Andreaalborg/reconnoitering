/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'picsum.photos',
      'artsandculture.google.com',
      'images.unsplash.com',  // Legg til denne for enkel tilgang til gratis bilder
      'upload.wikimedia.org'  // Legg til denne for Wikipedia-bilder
    ],
  },
  serverExternalPackages: ['bcrypt'],
};

module.exports = nextConfig;