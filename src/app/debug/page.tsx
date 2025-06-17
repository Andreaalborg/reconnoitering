export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Side</h1>
      <p>Hvis du ser dette, fungerer Next.js routing.</p>
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Timestamp: {new Date().toISOString()}</p>
      </div>
    </div>
  );
} 