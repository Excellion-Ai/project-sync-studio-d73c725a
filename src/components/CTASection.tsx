import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-[100px] bg-[#0A0A0A] relative overflow-hidden">
      {/* Dramatic spotlight */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[900px] h-[600px] bg-[radial-gradient(ellipse,rgba(201,168,76,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-foreground mb-6 leading-tight">
            Your course.{" "}
            <span className="text-gradient-gold">This weekend.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 font-body max-w-xl mx-auto">
            Generate the outline and sales page now. Film and publish when you're ready.
          </p>
          <Link
            to="/auth"
            className="btn-shimmer inline-flex items-center gap-2 px-10 py-5 rounded-[12px] btn-primary text-lg font-heading font-bold shadow-glow"
          >
            Start Building
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
