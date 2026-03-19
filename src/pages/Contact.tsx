import { Mail, Twitter, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EMAIL = "excellionai@gmail.com";

const infoCards = [
  {
    icon: Mail,
    label: "Email",
    value: EMAIL,
    href: `mailto:${EMAIL}`,
  },
  {
    icon: Twitter,
    label: "Twitter/X",
    value: "@excellionai",
    href: "https://twitter.com/excellionai",
  },
  {
    icon: Zap,
    label: "Response Time",
    value: "Within 24 hours",
    href: null as string | null,
  },
];

const Contact = () => {
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
            {infoCards.map(({ icon: Icon, label, value, href }) => {
              const Wrapper = href ? "a" : "div";
              const linkProps = href
                ? {
                    href,
                    target: href.startsWith("http") ? "_blank" : undefined,
                    rel: href.startsWith("http") ? "noopener noreferrer" : undefined,
                  }
                : {};
              return (
                <Wrapper
                  key={label}
                  {...linkProps}
                  className={`flex flex-col items-center text-center rounded-xl p-5 transition-colors ${
                    href ? "cursor-pointer hover:border-primary/40" : ""
                  }`}
                  style={{
                    background: "hsl(0 0% 9%)",
                    border: "1px solid hsl(43 52% 54% / 0.15)",
                  }}
                >
                  <Icon className="text-gold mb-2" size={22} />
                  <span className="text-foreground font-heading text-sm font-semibold mb-1">{label}</span>
                  <span className="text-muted-foreground font-body text-xs">{value}</span>
                </Wrapper>
              );
            })}
          </div>

          <p className="text-center text-muted-foreground text-sm font-body">
            We typically respond within 24 hours
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
