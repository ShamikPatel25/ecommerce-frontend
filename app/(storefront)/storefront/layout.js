import { headers } from 'next/headers';
import { StorefrontProviderWrapper } from '@/lib/StorefrontContext';
import StorefrontClientLayout from './StorefrontClientLayout';

export const metadata = {
  title: {
    template: '%s | Store',
    default: 'Store',
  },
  description: 'Discover premium, thoughtfully designed products for your everyday life.',
  robots: { index: true, follow: true },
};

export default async function StorefrontLayout({ children }) {
  const headersList = await headers();
  const isSubdomain = headersList.get('x-is-subdomain') === '1';

  return (
    <StorefrontProviderWrapper isSubdomain={isSubdomain}>
      <StorefrontClientLayout>{children}</StorefrontClientLayout>
    </StorefrontProviderWrapper>
  );
}
