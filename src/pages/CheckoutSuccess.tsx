import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useSubscription } from "@/hooks/useSubscription";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refresh, subscribed, loading } = useSubscription();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/secret-builder-hub");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-2xl font-heading font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground font-body">
            Your subscription is now active. You have full access to the Excellion course builder.
          </p>

          <div className="text-sm text-muted-foreground font-body">
            Redirecting to your dashboard in {countdown} seconds...
          </div>

          <button
            onClick={() => navigate("/secret-builder-hub")}
            className="px-6 py-3 rounded-[10px] btn-primary text-sm font-body"
          >
            Go to Dashboard Now
          </button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
