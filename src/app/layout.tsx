import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/app-provider";
import { EmotionRegistry } from "@/providers/emotion-registry";
import { ThemeProvider } from "next-themes";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recruitment Pipeline & Interview Intelligence Platform",
  description: "Recruitment Pipeline & Interview Intelligence Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <EmotionRegistry>
            <AppProvider>{children}</AppProvider>
          </EmotionRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
