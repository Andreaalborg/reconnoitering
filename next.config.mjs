/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
      // !! ADVARSEL !!
      // Ignorerer TypeScript-feil under bygget
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
  };
  
  export default nextConfig;