import React from 'react';
import Navbar from '../components/spa/Navbar';
import HeroSection from '../components/spa/HeroSection';
import MarqueeBanner from '../components/spa/MarqueeBanner';
import WhyChooseSection from '../components/spa/WhyChooseSection';
import ServicePortals from '../components/spa/ServicePortals';
import PhilosophySection from '../components/spa/PhilosophySection';
import ClinicalSection from '../components/spa/ClinicalSection';
import TestimonialsSection from '../components/spa/TestimonialsSection';
import BookingPanel from '../components/spa/BookingPanel';
import LatestBlogSection from '../components/spa/LatestBlogSection';
import Footer from '../components/spa/Footer';
// ChatWidget disabled until LLM backend is implemented

import { SITE_IMAGES as IMAGES } from '@/shared/constants/siteImages';

export default function Home() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <HeroSection heroImage={IMAGES.hero} />
      <MarqueeBanner />
      <WhyChooseSection />
      <LatestBlogSection />
      <ServicePortals images={[IMAGES.facial, IMAGES.body, IMAGES.skincare, IMAGES.hair, IMAGES.wellness]} />
      <ClinicalSection productImage={IMAGES.product} interiorImage={IMAGES.interior} />
      <PhilosophySection image={IMAGES.skincare} />
      <TestimonialsSection />
      <BookingPanel bgImage={IMAGES.interior} />
      <Footer />
    </div>
  );
}