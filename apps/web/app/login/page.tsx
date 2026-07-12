import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthPanel } from '@/components/marketing/AuthPanel';
import { MarketingStyles } from '@/components/marketing/MarketingStyles';

export const metadata: Metadata = {
  title: 'Log in — Lead Booster Pro',
  description: 'Log in to Lead Booster Pro by ManageAI.',
};

export default function LoginPage() {
  return (
    <div className="mkt">
      <MarketingStyles />
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--navy)' }} />}>
        <AuthPanel mode="login" />
      </Suspense>
    </div>
  );
}
