import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SocialProofTicker from "@/components/SocialProofTicker";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";

import QuickstartSection from "@/components/QuickstartSection";
import PricingSection from "@/components/PricingSection";
import GuaranteeSection from "@/components/GuaranteeSection";
import FAQSection from "@/components/FAQSection";
import WaitlistSection from "@/components/WaitlistSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const WebBuilderHome = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <SocialProofTicker />
      <StatsBar />
      <HowItWorksSection />
      <FeaturesSection />
      
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

export default WebBuilderHome;
