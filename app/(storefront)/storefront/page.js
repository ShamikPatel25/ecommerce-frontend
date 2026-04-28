import StorefrontHomeClient from '@/components/storefront/StorefrontHomeClient';

export const metadata = {
  title: 'Home',
  description: 'Discover premium, thoughtfully designed products for your everyday life. Shop now for free shipping on orders over $150.',
  openGraph: {
    title: 'Home | Store',
    description: 'Discover premium, thoughtfully designed products for your everyday life.',
    type: 'website',
  },
};

export default function StorefrontHomePage() {
  return <StorefrontHomeClient />;
}
