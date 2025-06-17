export default function SimpleTestPage() {
  return (
    <html>
      <body>
        <h1>Simple HTML Test</h1>
        <p>If you see this, Next.js routing works!</p>
        <p>Time: {new Date().toISOString()}</p>
        <hr />
        <h2>Links to test:</h2>
        <ul>
          <li><a href="/api/simple-test">Test API Route</a></li>
          <li><a href="/test-page">Test Page</a></li>
          <li><a href="/">Home (might be blank)</a></li>
        </ul>
      </body>
    </html>
  );
}