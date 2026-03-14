import { useState } from "react";
import { Mail, Twitter, Zap, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const infoCards = [
  { icon: Mail, label: "Email", value: "excellionai@gmail.com" },
  { icon: Twitter, label: "Twitter/X", value: "@excellionai" },
  { icon: Zap, label: "Response Time", value: "Within 24 hours" },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast({ title: "Message sent!", description: "We'll get back to you within 24 hours." });
      setForm({ name: "", email: "", message: "" });
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-2xl mx-auto">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-center text-foreground mb-4">
            Contact <span className="text-gradient-gold">Us</span>
          </h1>
          <p className="text-center text-muted-foreground font-body mb-10">
            Have a question or need help? Reach out and we'll get back to you.
          </p>

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {infoCards.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex flex-col items-center text-center rounded-xl p-5"
                style={{
                  background: "hsl(0 0% 9%)",
                  border: "1px solid hsl(43 52% 54% / 0.15)",
                }}
              >
                <Icon className="text-gold mb-2" size={22} />
                <span className="text-foreground font-heading text-sm font-semibold mb-1">{label}</span>
                <span className="text-muted-foreground font-body text-xs">{value}</span>
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mx-auto max-w-[560px] space-y-5">
            <p className="text-center text-muted-foreground text-sm font-body mb-2">
              We typically respond within 24 hours
            </p>
            <Input
              placeholder="Your name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="bg-card border-border focus-visible:ring-ring"
            />
            <Input
              type="email"
              placeholder="Your email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="bg-card border-border focus-visible:ring-ring"
            />
            <Textarea
              placeholder="Your message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              required
              rows={5}
              className="bg-card border-border focus-visible:ring-ring resize-none"
            />
            <Button
              type="submit"
              disabled={sending}
              className="w-full gradient-gold text-primary-foreground font-heading font-semibold text-base py-5 rounded-xl"
            >
              {sending ? "Sending…" : "Send Message"}
              {!sending && <ArrowRight className="ml-2" size={18} />}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
