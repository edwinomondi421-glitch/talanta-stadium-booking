
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talanta Stadium Booking",
  description:
    "Discover events, explore ticket categories and book your stadium experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
