import { useState, useEffect, useCallback, useRef } from "react";
import { Sparkles, Mic, ArrowRight, X, FileText, Link as LinkIcon, Palette } from "lucide-react";
import AttachmentMenu from "@/components/secret-builder/attachments/AttachmentMenu";
import type { AttachmentItem } from "@/components/secret-builder/attachments/types";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";

const suggestions = [
  "6-week fat loss course",
  "Beginner strength course",
  "Home workout fundamentals course",
];

const TYPING_PHRASES = [
  "Help busy moms lose 10 lbs in 8 weeks",
  "Build a 6-week strength program for beginners",
  "Create a 30-day mobility challenge",
  "Launch a nutrition coaching course for athletes",
];

const TYPING_SPEED = 35;
const DELETING_SPEED = 20;
const PAUSE_AFTER_TYPE = 1200;
const PAUSE_AFTER_DELETE = 300;

function useTypingAnimation(phrases: string[], active: boolean) {
  const [display, setDisplay] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;
    const phrase = phrases[phraseIdx];

    if (!isDeleting && charIdx < phrase.length) {
      const t = setTimeout(() => {
        setDisplay(phrase.slice(0, charIdx + 1));
        setCharIdx(charIdx + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(t);
    }

    if (!isDeleting && charIdx === phrase.length) {
      const t = setTimeout(() => setIsDeleting(true), PAUSE_AFTER_TYPE);
      return () => clearTimeout(t);
    }

    if (isDeleting && charIdx > 0) {
      const t = setTimeout(() => {
        setDisplay(phrase.slice(0, charIdx - 1));
        setCharIdx(charIdx - 1);
      }, DELETING_SPEED);
      return () => clearTimeout(t);
    }

    if (isDeleting && charIdx === 0) {
      const t = setTimeout(() => {
        setIsDeleting(false);
        setPhraseIdx((phraseIdx + 1) % phrases.length);
      }, PAUSE_AFTER_DELETE);
      return () => clearTimeout(t);
    }
  }, [active, charIdx, isDeleting, phraseIdx, phrases]);

  return display;
}

const HeroSection = () => {
  const [prompt, setPrompt] = useState("");
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [guidedMode, setGuidedMode] = useState(false);
  const [gQ1, setGQ1] = useState("");
  const [gQ2, setGQ2] = useState("");
  const [gQ3, setGQ3] = useState("");

  const handleAddAttachment = (item: AttachmentItem) => {
    setAttachments((prev) => [...prev, item]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const animatedText = useTypingAnimation(TYPING_PHRASES, !userHasTyped && !prompt);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (!userHasTyped && e.target.value) setUserHasTyped(true);
    if (userHasTyped && !e.target.value) setUserHasTyped(false);
  };

  const buildGuidedPrompt = (q1: string, q2: string, q3: string) => {
    const parts = [
      q1.trim() && `Course about: ${q1.trim()}`,
      q2.trim() && `Target audience: ${q2.trim()}`,
      q3.trim() && `Transformation: ${q3.trim()}`,
    ].filter(Boolean).join(". ");
    setPrompt(parts);
    if (parts && !userHasTyped) setUserHasTyped(true);
    if (!parts) setUserHasTyped(false);
  };

  const updateGuided = (field: 1 | 2 | 3, value: string) => {
    const n1 = field === 1 ? value : gQ1;
    const n2 = field === 2 ? value : gQ2;
    const n3 = field === 3 ? value : gQ3;
    if (field === 1) setGQ1(value);
    if (field === 2) setGQ2(value);
    if (field === 3) setGQ3(value);
    buildGuidedPrompt(n1, n2, n3);
  };

  const handleGenerate = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-body font-semibold tracking-wide">Now Live — Start Building Free</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-foreground leading-tight mb-6">
            Launch your fitness course in{" "}
            <em className="not-italic text-gradient-gold">1 weekend.</em>
          </h1>

          <p className="text-sm text-primary/80 font-body font-medium mb-6">Join 200+ fitness coaches already building on Excellion</p>

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
          <div className="relative rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-3">
            {/* Toggle link */}
            <div className="mb-2">
              <button
                onClick={() => {
                  setGuidedMode(!guidedMode);
                  if (guidedMode) { setGQ1(""); setGQ2(""); setGQ3(""); }
                }}
                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-medium font-body"
              >
                <Sparkles className="w-3 h-3" />
                {guidedMode ? "Back to simple mode" : "Need help? Use guided mode"}
              </button>
            </div>

            {/* Guided fields */}
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: guidedMode ? "260px" : "0px", opacity: guidedMode ? 1 : 0 }}
            >
              <div className="space-y-2.5 pb-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground font-body">What's your course about?</label>
                  <input
                    placeholder="e.g. 6-week fat loss program, booty building, macro tracking"
                    value={gQ1}
                    onChange={(e) => updateGuided(1, e.target.value)}
                    className="w-full bg-muted/20 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-body"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground font-body">Who is it for?</label>
                  <input
                    placeholder="e.g. busy moms, beginners, women over 40"
                    value={gQ2}
                    onChange={(e) => updateGuided(2, e.target.value)}
                    className="w-full bg-muted/20 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-body"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground font-body">What's the #1 transformation they'll experience?</label>
                  <input
                    placeholder="e.g. lose 10 pounds, build a home workout habit, understand their macros"
                    value={gQ3}
                    onChange={(e) => updateGuided(3, e.target.value)}
                    className="w-full bg-muted/20 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-body"
                  />
                </div>
                <div className="border-t border-primary/10" />
              </div>
            </div>

            {/* Main textarea */}
            <textarea
              value={prompt}
              onChange={(e) => {
                handlePromptChange(e);
                if (guidedMode) { setGuidedMode(false); setGQ1(""); setGQ2(""); setGQ3(""); }
              }}
              placeholder={!userHasTyped && !prompt ? "" : "Help [AUDIENCE] achieve [RESULT] in [TIMEFRAME]"}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none border-none outline-none text-base min-h-[60px] font-body"
              rows={2}
            />
            {!prompt && !userHasTyped && !guidedMode && (
              <span className="absolute top-[calc(2rem+24px)] left-3 text-base text-muted-foreground pointer-events-none font-body">
                {animatedText}
                <span className="inline-block w-[2px] h-[1.1em] bg-primary/70 ml-[1px] align-text-bottom animate-blink" />
              </span>
            )}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                {attachments.map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/20 text-xs text-primary">
                    <FileText className="w-3 h-3" />
                    {a.name}
                    <button onClick={() => handleRemoveAttachment(a.id)} className="hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1.5">
              <AttachmentMenu onAdd={handleAddAttachment} />
              <button className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors" title="Voice input">
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {["Generated in 60 seconds", "Published on your domain", "Keep 100% of revenue"].map((stat) => (
              <span
                key={stat}
                className="px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary/90 font-body font-medium"
              >
                {stat}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleHowItWorks}
              className="flex-1 px-6 py-3 rounded-[10px] bg-secondary text-foreground font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors font-body"
            >
              <Sparkles className="w-4 h-4" />
              See how it works
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 px-6 py-3 rounded-[10px] btn-primary text-sm flex items-center justify-center gap-2 font-body"
            >
              Start Building Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground font-body">No credit card required.</p>

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
