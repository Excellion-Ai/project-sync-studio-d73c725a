import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { analytics } from "@/lib/analytics";

const features = [
  "Unlimited courses",
  "Unlimited page views",
  "Custom domain",
  "Intake & check-ins",
  "Student portal",
  "Built-in analytics",
];

const PricingSection = () => {
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    analytics.pricingPageViewed({ source: "landing_pricing_section" });
  }, []);
  const { user } = useAuth();
  const { subscribed, startCheckout } = useSubscription();

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth?mode=signup&redirect=/paywall");
      return;
    }
    if (subscribed) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      await startCheckout(yearly ? "annual" : "monthly");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="py-[60px] bg-background relative radial-glow">
      <div className="max-w-lg mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Pricing</h2>
          <p className="text-muted-foreground text-lg font-body">One plan for fitness course creators.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setYearly(false)}
              className={`text-sm font-medium px-4 py-1.5 rounded-[10px] transition-colors font-body ${!yearly ? "btn-primary" : "text-muted-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`text-sm font-medium px-4 py-1.5 rounded-[10px] transition-colors font-body ${yearly ? "btn-primary" : "text-muted-foreground"}`}
            >
              Yearly
            </button>
            {yearly && <span className="text-xs text-primary font-medium font-body">Save $158</span>}
          </div>

          {/* Card with animated border + pulse glow */}
          <div className="relative">
            {/* Most Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="px-4 py-1 rounded-full text-xs font-bold font-body bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-black uppercase tracking-wider">
                Most Popular
              </span>
            </div>
            {/* Animated gradient border */}
            <div className="pricing-animated-border rounded-2xl p-[1px]">
              <div className="premium-card p-8 text-center rounded-2xl pricing-glow-pulse">
            <div className="mb-2">
              <span className="text-4xl font-heading font-black text-gradient-gold">{yearly ? "$790" : "$29"}</span>
              {!yearly && (
                <span className="inline-flex items-center ml-2 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-semibold uppercase tracking-wider font-body align-middle">
                  First month
                </span>
              )}
              {yearly && <span className="text-muted-foreground text-sm ml-2 font-body">/year</span>}
            </div>
            {!yearly && (
              <p className="text-foreground/90 text-base font-semibold mb-1 font-body">
                Then $79/month
              </p>
            )}
            <p className="text-muted-foreground text-sm mb-8 font-body">
              {yearly ? "Save $158 a year · " : ""}Everything included. Cancel anytime.
            </p>

            <ul className="space-y-3 mb-8 text-left">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-foreground font-body">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full px-6 py-3 rounded-[10px] btn-primary text-sm flex items-center justify-center font-body disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                yearly ? "Start for $790/yr" : "Start for $29 first month"
              )}
            </button>

            <p className="text-xs text-muted-foreground mt-4 font-body">No hidden fees. Just build and sell your course.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
