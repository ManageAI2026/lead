import type { Metadata } from 'next';
import { CtaBand } from '@/components/marketing/CtaBand';
import { VideoLibrary } from '@/components/marketing/VideoLibrary';

export const metadata: Metadata = {
  title: 'Videos — Lead Booster Pro',
  description: 'Short how-to videos for every part of the platform. Watch how to run each part of it.',
};

export default function VideosPage() {
  return (
    <div className="lbpm-fade">
      <section data-pad="" style={{ maxWidth: 1000, margin: '0 auto', padding: '70px 40px 20px', textAlign: 'center' }}>
        <div style={{ font: '700 12px var(--f)', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 12 }}>Videos</div>
        <h1 data-h1="" style={{ font: '800 44px/1.08 var(--f)', letterSpacing: '-.03em', margin: 0, color: 'var(--navy)' }}>
          Watch how to run every part of it.
        </h1>
        <p style={{ font: '400 18px/1.6 var(--f)', color: 'var(--text2)', margin: '18px auto 0', maxWidth: 600 }}>
          Short how-to videos for every part of the platform. Click any one to play.
        </p>
      </section>
      <section data-pad="" style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 40px' }}>
        <VideoLibrary />
      </section>
      <CtaBand />
    </div>
  );
}
