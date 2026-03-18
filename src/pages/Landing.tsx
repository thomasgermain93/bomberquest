import React from 'react';
import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import CoreFeatures from '@/components/landing/CoreFeatures';
import BenefitsGrid from '@/components/landing/BenefitsGrid';
import FaqSection from '@/components/landing/FaqSection';
import CtaSection from '@/components/landing/CtaSection';
import Footer from '@/components/landing/Footer';
import { useKpis } from '@/hooks/useKpis';
import { usePageMeta } from '@/hooks/usePageMeta';

const Landing: React.FC = () => {
  const { kpis, kpisLoading } = useKpis();
  usePageMeta();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <CoreFeatures />
      <BenefitsGrid kpis={kpis} kpisLoading={kpisLoading} />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  );
};

export default Landing;
