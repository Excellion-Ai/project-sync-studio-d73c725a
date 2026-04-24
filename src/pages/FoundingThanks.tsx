import { CheckCircle2, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const FoundingThanks = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navigation />
    <main className="flex-1 flex items-center justify-center px-4 pt-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Application received.
        </h1>
        <p className="text-muted-foreground font-body text-sm leading-relaxed">
          I review every application personally, usually within 48 hours.
          If you are a fit, I will reach out with next steps. Follow
          @ExcellionAI on TikTok and X to see who makes the cohort in
          real time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href="https://www.tiktok.com/@excellionai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium font-body hover:bg-secondary transition-colors"
          >
            Watch on TikTok <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://x.com/ExcellionAI"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium font-body hover:bg-secondary transition-colors"
          >
            Follow on X <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

export default FoundingThanks;
