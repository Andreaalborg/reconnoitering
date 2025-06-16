export default function TestStatic() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Statisk Test Side</h1>
      <p>Hvis du kan se denne siden, fungerer Next.js på Vercel!</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
} 