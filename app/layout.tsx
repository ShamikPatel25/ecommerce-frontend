import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'E-commerce Admin',
  description: 'Multi-tenant e-commerce platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}