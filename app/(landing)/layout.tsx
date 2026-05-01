import '../../styles/landing.css';

export const metadata = {
  title: 'StoreScale | Multi-Tenant White-Label eCommerce Platform',
  description:
    'Launch multiple white-label eCommerce stores with auto subdomain provisioning. Perfect for startups, agencies, and multi-brand businesses.',
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="storefront-theme">{children}</div>;
}
