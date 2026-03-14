import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-[60px] bg-[hsl(0_0%_5%)] relative">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[400px] bg-[radial-gradient(ellipse,hsl(43_52%_54%/0.08)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Ready to launch your course this weekend?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 font-body">
            Generate the outline and sales page now. Film and publish when you're ready.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[10px] btn-primary font-semibold font-body"
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
