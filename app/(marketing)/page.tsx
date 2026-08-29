import { Faq } from '@/components/landing/Faq';
import { Footer } from '@/components/landing/Footer';
import { GrainOverlay } from '@/components/landing/GrainOverlay';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { MobileCtaBar } from '@/components/landing/MobileCtaBar';
import { Nav } from '@/components/landing/Nav';
import { Privacy } from '@/components/landing/Privacy';
import { RevealScrubber } from '@/components/landing/RevealScrubber';

export default function MarketingHomePage() {
  return (
    <div className="overflow-x-hidden max-[759px]:pb-64">
      <GrainOverlay />
      <Nav />
      <Hero />
      <RevealScrubber />
      <HowItWorks />
      <Privacy />
      <Faq />
      <Footer />
      <MobileCtaBar />
    </div>
  );
}
