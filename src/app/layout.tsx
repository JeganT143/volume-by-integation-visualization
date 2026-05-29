import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volume Integration Visualizer | Interactive 3D Calculus",
  description:
    "Learn the concept of volume under a curve using integration with interactive 3D visualizations. Explore disk, washer, and shell methods with guided animations.",
  keywords: [
    "calculus", "integration", "volume", "3D", "interactive", "disk method",
    "washer method", "shell method", "Riemann sum", "STEM", "education"
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
