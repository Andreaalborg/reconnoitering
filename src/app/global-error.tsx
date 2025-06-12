'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Kritisk feil oppstod!
            </h2>
            <p className="text-gray-600 mb-4">
              {error.message || 'En uventet feil oppstod på applikasjonsnivå'}
            </p>
            <details className="mb-4 text-left max-w-lg">
              <summary className="cursor-pointer text-sm text-gray-500">
                Tekniske detaljer
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Last inn på nytt
            </button>
          </div>
        </div>
      </body>
    </html>
  );
} 