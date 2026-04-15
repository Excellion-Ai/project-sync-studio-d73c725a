import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, X, FileText } from "lucide-react";
import heroImg from "@/assets/hero-bg.jpg";
import AttachmentMenu from "@/components/secret-builder/attachments/AttachmentMenu";
import type { AttachmentMenuHandle } from "@/components/secret-builder/attachments/AttachmentMenu";
import type { AttachmentItem } from "@/components/secret-builder/attachments/types";
import { motion } from "framer-motion";
import { GuidedPromptBuilder } from "@/components/builder/GuidedPromptBuilder";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const ALLOWED_EMAIL = "excellionai@gmail.com";

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribed, startCheckout } = useSubscription();

  const [prompt, setPrompt] = useState("");
  const [userHasTyped, setUserHasTyped] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingBrandStyle, setPendingBrandStyle] = useState<any>(undefined);
  const attachMenuRef = useRef<AttachmentMenuHandle>(null);

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

  /** Store structured draft and navigate to builder */
  const handleStartBuilding = async () => {
    if (isStarting) return;

    // Check access
    if (!user) {
      // Store draft so it persists through auth
      if (prompt.trim()) {
        const draft = buildDraft();
        localStorage.setItem("builder-draft", JSON.stringify(draft));
        localStorage.setItem("builder-initial-idea", prompt);
      }
      navigate("/auth?redirect=/secret-builder-hub");
      return;
    }

    const isAllowed = user.email === ALLOWED_EMAIL || subscribed;
    if (!isAllowed) {
      try {
        await startCheckout("monthly");
      } catch {
        toast.error("Could not start checkout. Please try again.");
      }
      return;
    }

    if (!prompt.trim()) {
      toast.error("Enter a course idea first.");
      return;
    }

    setIsStarting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      // Store structured draft
      const draft = buildDraft();
      localStorage.setItem("builder-draft", JSON.stringify(draft));
      localStorage.setItem("builder-initial-idea", prompt);

      // Create project
      const { data: proj, error } = await supabase
        .from("builder_projects")
        .insert({ name: prompt.slice(0, 80), user_id: session.user.id })
        .select("id")
        .single();
      if (error || !proj) throw error;

      const pdfAttachment = attachments.find((a) =>
        a.base64Data && (
          a.mimeType === "application/pdf" ||
          a.name?.toLowerCase().endsWith(".pdf")
        )
      );

      localStorage.setItem("last-project-id", proj.id);

      // Store PDF in sessionStorage (router state can silently drop large payloads)
      if (pdfAttachment?.base64Data) {
        try {
          sessionStorage.setItem("builder-pdf-base64", pdfAttachment.base64Data);
          sessionStorage.setItem("builder-pdf-name", pdfAttachment.name);
        } catch (e) {
          console.warn("Failed to store PDF in sessionStorage:", e);
        }
      }

      navigate(`/studio/${proj.id}`, {
        state: {
          initialIdea: prompt,
          pdfName: pdfAttachment?.name,
        },
      });
    } catch (err: any) {
      console.error("handleStartBuilding error:", err);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  /** Build a structured draft object from current state */
  const buildDraft = () => ({
    prompt: prompt.trim(),
    guided: {
      attachmentText: attachments
        .filter((a) => a.content)
        .map((a) => `--- ${a.name} ---\n${a.content}`)
        .join("\n\n") || undefined,
      brandStyle: pendingBrandStyle || undefined,
    },
  });

  const handleHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 45%, transparent 0%, rgba(0,0,0,0.5) 100%)' }} />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-primary font-body font-semibold tracking-wide">Full Course in 1 Weekend</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-foreground leading-tight mb-6">
            Launch your fitness course in{" "}
            <em className="not-italic text-gradient-gold">1 weekend.</em>
          </h1>

          <p className="text-sm text-primary/80 font-body font-medium mb-6">Built for coaches who are done waiting to launch</p>

          <p
            className="max-w-2xl mx-auto mb-10 font-body font-light text-lg text-white/90"
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
          <div className="rounded-xl border border-primary/20 bg-black/40 backdrop-blur-sm p-4">
            <GuidedPromptBuilder
              onPromptChange={(p) => {
                setPrompt(p);
                if (p && !userHasTyped) setUserHasTyped(true);
                if (!p) setUserHasTyped(false);
              }}
              onGenerate={(p, brandStyle) => {
                setPrompt(p);
                setPendingBrandStyle(brandStyle);
                setUserHasTyped(true);
                handleStartBuilding();
              }}
              isGenerating={isStarting}
              hasAttachment={attachments.length > 0}
              onUploadClick={() => attachMenuRef.current?.openFilePicker()}
            />
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
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
            <AttachmentMenu ref={attachMenuRef} onAdd={handleAddAttachment} />
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
              onClick={handleStartBuilding}
              disabled={isStarting}
              className="flex-1 px-6 py-3 rounded-[10px] btn-primary text-sm flex items-center justify-center gap-2 font-body disabled:opacity-50"
            >
              {isStarting ? "Creating…" : "Start Building Free"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground font-body">No credit card required.</p>

          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => { setPrompt(s); setUserHasTyped(true); }}
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
