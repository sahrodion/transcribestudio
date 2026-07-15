import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Transcribe Studio",
    template: "%s · Transcribe Studio",
  },
  description:
    "Turn every recording into clear, usable text. Upload audio or video and receive an accurate transcript you can review, copy and export.",
  applicationName: "Transcribe Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppHeader />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster
            richColors
            closeButton
            position="top-center"
            theme="system"
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
