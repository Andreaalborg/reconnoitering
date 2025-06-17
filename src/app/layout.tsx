import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reconnoitering - Art Exhibitions Worldwide",
  description: "Discover art exhibitions based on your travel dates and interests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "20px", backgroundColor: "lightblue" }}>
          <h1>DEBUG: Layout is rendering</h1>
          {children}
        </div>
      </body>
    </html>
  );
}