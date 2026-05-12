import "./globals.css";

export const metadata = {
  title: "Clendr",
  description: "A Fantastical-inspired public calendar built with Next.js"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

