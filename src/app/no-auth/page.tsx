export default function NoAuthPage() {
  return (
    <html>
      <body>
        <h1>Page Without Auth Provider</h1>
        <p>This bypasses the root layout completely.</p>
        <p>If this works but other pages don't, NextAuth is the problem.</p>
      </body>
    </html>
  );
}