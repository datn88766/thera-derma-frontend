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

const IMAGES = {
  hero: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/b56c104bf_image.png',
  facial: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/0cd58707a_generated_4ce2e633.png',
  body: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/ed6cf33b7_generated_a1767a0b.png',
  skincare: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/d97f3d3ca_generated_615f11a9.png',
  interior: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/b56c104bf_image.png',
  product: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/80e900a1d_494447355_122151370334474837_2740624178693674560_n.jpg',
  hair: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/465c6f93f_generated_1f18d52b.png',
  wellness: 'https://media.base44.com/images/public/69e98326eaa5ac077903e89c/e9c63e293_generated_02795347.png',
};

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