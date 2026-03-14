import { motion } from "framer-motion";
import { Shield } from "lucide-react";

const GuaranteeSection = () => {
  return (
    <section className="py-[60px] bg-background">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="premium-card p-8 text-center flex flex-col items-center gap-4"
        >
          <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
            <Shield className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-heading font-bold text-foreground">
            7-day money-back guarantee
          </h3>
          <p className="text-muted-foreground text-sm font-body">
            No questions asked. If Excellion isn't for you, get a full refund within 7 days.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default GuaranteeSection;
