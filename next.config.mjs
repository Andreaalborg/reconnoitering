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
  serverExternalPackages: ['bcrypt'],
  // Legg til denne konfigurasjonen for å deaktivere statisk pre-rendering
  experimental: {
    // Kjører alt på serveren, ingen statisk generering
    appDir: true,
    serverActions: true
  },
  // Konfigurer output til å bruke "standalone" server
  output: 'standalone',
};

export default nextConfig;