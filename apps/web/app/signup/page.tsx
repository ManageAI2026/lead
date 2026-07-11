import { Suspense } from 'react';
import type { Metadata } from 'next';
import { AuthPanel } from '@/components/marketing/AuthPanel';
import { MarketingStyles } from '@/components/marketing/MarketingStyles';

export const metadata: Metadata = {
  title: 'Start free — Lead Booster Pro',
  description: 'Create your Lead Booster Pro account. No credit card, bring your own keys.',
};

export default function SignupPage() {
  return (
    <div className="mkt">
      <MarketingStyles />
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--navy)' }} />}>
        <AuthPanel mode="signup" />
      </Suspense>
    </div>
  );
}
