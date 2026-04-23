import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import SocialProofBlock from "@/components/SocialProofBlock";
import SocialProofTicker from "@/components/SocialProofTicker";
import StatsBar from "@/components/StatsBar";
import HowItWorksSection from "@/components/HowItWorksSection";
import DemoVideo from "@/components/DemoVideo";
import FeaturesSection from "@/components/FeaturesSection";


import PricingSection from "@/components/PricingSection";
import GuaranteeSection from "@/components/GuaranteeSection";
import FAQSection from "@/components/FAQSection";

import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const WebBuilderHome = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <SocialProofBlock />
      <SocialProofTicker />
      <StatsBar />
      <DemoVideo videoId="Q4rZfRfJIqg" />
      <HowItWorksSection />
      <FeaturesSection />


      <PricingSection />
      <GuaranteeSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default WebBuilderHome;
