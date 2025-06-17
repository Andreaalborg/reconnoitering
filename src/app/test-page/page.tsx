export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page</h1>
      <p>If you can see this, Next.js is working!</p>
      <p>Time: {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Environment Check:</h2>
        <ul>
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>Has Google Maps Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}