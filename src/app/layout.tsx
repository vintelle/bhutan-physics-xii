import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: { default: "Bhutan Grade XII Physics Quiz Platform", template: "%s · XII Physics" },
  description: "Curriculum-aligned practice, instant feedback, progress tracking and an AI tutor for Class XII Physics (Science Curriculum Framework 2022 and Physics Instructional Guide 2022).",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
