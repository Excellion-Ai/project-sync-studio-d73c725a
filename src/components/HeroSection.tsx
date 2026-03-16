import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Mic, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const suggestions = [
  "6-week fat loss course",
  "Beginner strength course",
  "Home workout fundamentals course",
];

const HeroSection = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const handleGenerate = () => {
    if (prompt.trim()) {
      localStorage.setItem("builder-initial-idea", prompt.trim());
      navigate("/auth");
    }
  };

  const handleExample = () => {
    setPrompt("Help busy dads lose 20lbs in 12 weeks with home workouts");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[hsl(0_0%_4%/0.7)]" />
      </div>

      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[600px] bg-[radial-gradient(ellipse,hsl(43_52%_54%/0.1)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card-light mb-8">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-body">AI Course Builder for Fitness Creators</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-foreground leading-tight mb-6">
            Launch your fitness course in{" "}
            <em className="not-italic text-gradient-gold">1 weekend.</em>
          </h1>

          <p
            className="max-w-2xl mx-auto mb-10 font-body font-light rounded-lg inline-block"
            style={{
              fontSize: "18px",
              color: "rgba(255,255,255,0.90)",
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
              background: "rgba(0,0,0,0.3)",
              borderRadius: "8px",
              padding: "8px 16px",
            }}
          >
            Excellion generates your course outline, lesson plan, sales page copy, and student portal from 1 prompt. Spend the weekend polishing, filming, and publishing.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="premium-card p-6 space-y-4"
        >
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Help [AUDIENCE] achieve [RESULT] in [TIMEFRAME]"
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none text-base min-h-[60px] font-body"
              rows={2}
            />
            <button className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors">
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExample}
              className="flex-1 px-6 py-3 rounded-[10px] bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors font-body"
            >
              <Sparkles className="w-4 h-4" />
              See an example
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 px-6 py-3 rounded-[10px] btn-primary text-sm flex items-center justify-center gap-2 font-body"
            >
              Generate my course
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="px-3 py-1.5 rounded-full glass-card-light text-xs text-muted-foreground hover:text-foreground transition-colors font-body"
              >
                {s}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
