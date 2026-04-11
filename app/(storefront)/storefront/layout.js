import { headers } from 'next/headers';
import { StorefrontProviderWrapper } from '@/lib/StorefrontContext';
import StorefrontClientLayout from './StorefrontClientLayout';

export default async function StorefrontLayout({ children }) {
  const headersList = await headers();
  const isSubdomain = headersList.get('x-is-subdomain') === '1';

  return (
    <StorefrontProviderWrapper isSubdomain={isSubdomain}>
      <StorefrontClientLayout>{children}</StorefrontClientLayout>
    </StorefrontProviderWrapper>
  );
}
