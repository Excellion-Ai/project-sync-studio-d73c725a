import { motion } from "framer-motion";
import { Play, CheckCircle } from "lucide-react";

const QuickstartSection = () => {

  return (
    <section className="py-[60px] bg-background relative radial-glow">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Excellion Quickstart Course (Preview)</h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto font-body">
            One voice call creates your prompt. One click generates a complete draft — course, scripts, downloads, and sales page. Then refine any section with a typed command.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {[
              "Generate a full draft from a single AI prompt",
              "Refine any section by typing a command",
              "Publish and share a live link on your schedule",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground text-sm font-body">{item}</span>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="premium-card p-6"
          >
            <h3 className="text-sm font-heading font-semibold text-primary mb-4">Course Outline</h3>
            <ul className="space-y-3">
              {[
                "Module 1: Prompt Call (Start Here)",
                "Module 2: Generate + Review Your Draft",
                "Module 3: Regenerate Anything",
                "Module 4: Publish + Go Live",
              ].map((mod, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground font-body">
                  <Play className="w-4 h-4 text-primary shrink-0" />
                  {mod}
                </li>
              ))}
            </ul>

            <a
              href="/auth"
              className="mt-6 w-full px-6 py-3 rounded-[10px] btn-primary text-sm flex items-center justify-center gap-2 font-body"
            >
              Start Building
            </a>

            <p className="text-xs text-muted-foreground text-center mt-3 font-body">Most coaches finish setup in 1 weekend.</p>
          </motion.div>
        </div>
      </div>

      
    </section>
  );
};

export default QuickstartSection;
