import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import SocialProofTicker from "@/components/SocialProofTicker";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import QuickstartSection from "@/components/QuickstartSection";
import PricingSection from "@/components/PricingSection";
import GuaranteeSection from "@/components/GuaranteeSection";
import FAQSection from "@/components/FAQSection";
import WaitlistSection from "@/components/WaitlistSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <SocialProofTicker />
      <StatsBar />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <QuickstartSection />
      <PricingSection />
      <GuaranteeSection />
      <FAQSection />
      <WaitlistSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
