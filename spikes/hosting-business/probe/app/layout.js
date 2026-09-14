export const metadata = { title: "Sonde hébergement (spike)", robots: { index: false, follow: false } };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
