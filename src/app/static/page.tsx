export default function StaticPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Statisk Test</h1>
      <p>Dette er en helt statisk side uten JavaScript.</p>
      <p style={{ marginTop: '1rem' }}>Hvis du ser dette, fungerer server-side rendering.</p>
    </div>
  );
} 