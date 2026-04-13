import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofTicker from "@/components/SocialProofTicker";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import PricingSection from "@/components/PricingSection";
import GuaranteeSection from "@/components/GuaranteeSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import "@/styles/cinematic.css";

const SectionDivider = () => <div className="section-divider w-full" />;

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Global noise texture */}
      <div className="noise-overlay" />

      <Navbar />
      <HeroSection />

      <SocialProofTicker />
      <SectionDivider />
      <StatsBar />
      <SectionDivider />
      <HowItWorksSection />
      <SectionDivider />
      <FeaturesSection />
      <SectionDivider />
      <TestimonialsSection />
      <SectionDivider />
      <PricingSection />
      <SectionDivider />
      <GuaranteeSection />
      <SectionDivider />
      <FAQSection />
      <SectionDivider />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
