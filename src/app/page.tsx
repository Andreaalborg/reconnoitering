export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold mb-4">Reconnoitering - Fungerer!</h1>
        <p className="text-lg mb-4">
          Hvis du ser denne teksten, fungerer Next.js på Vercel.
        </p>
        <p className="text-sm text-gray-600">
          Dette er en midlertidig testside for feilsøking.
        </p>
        <div className="mt-8 space-y-4">
          <a href="/test-static" className="block text-blue-600 hover:underline">
            → Test statisk side
          </a>
          <a href="/debug-vercel" className="block text-blue-600 hover:underline">
            → Debug Vercel info
          </a>
          <a href="/api/health" className="block text-blue-600 hover:underline">
            → API Health Check
          </a>
        </div>
      </div>
    </div>
  );
}