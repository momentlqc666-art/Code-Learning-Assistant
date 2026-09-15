import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THREXIS // Security Operations Command Center",
  description:
    "Threat Hunting & Real-Time Exploitation Exposure Intelligent System",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
