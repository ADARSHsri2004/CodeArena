import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "@/app/globals.css";
import { AppProviders } from "@/providers/app-providers";
import { PublicNavbar } from "@/components/layout/public-navbar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeArena",
    template: "%s | CodeArena",
  },
  description:
    "Real-time 1v1 competitive programming battles for developers worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AppProviders>
          <div className="flex min-h-screen flex-col">
            <PublicNavbar />
            <div className="flex-1">{children}</div>
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
