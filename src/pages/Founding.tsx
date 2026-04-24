import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SocialProofFounding from "@/components/founding/SocialProofFounding";

const SPOTS_TOTAL = 10;
const SPOTS_REMAINING = 10;
const SIGNUP_URL = "https://excellioncourses.com/auth?ref=founding";

const GOLD = "#C9A84C";
const BG = "hsl(38 10% 6%)";
const TEXT = "hsl(40 30% 92%)";
const MUTED = "hsl(40 8% 65%)";
const CARD_BG = "hsl(38 10% 9%)";
const BORDER = "hsl(38 15% 18%)";

const headingFont = '"Playfair Display", serif';
const bodyFont = '"DM Sans", sans-serif';

const GoldButton = ({ children }: { children: React.ReactNode }) => (
  <a
    href={SIGNUP_URL}
    className="inline-block transition-transform duration-200 ease-out hover:scale-[1.03]"
    style={{
      backgroundColor: GOLD,
      color: "hsl(38 30% 8%)",
      fontFamily: bodyFont,
      fontWeight: 600,
      fontSize: "16px",
      letterSpacing: "0.02em",
      padding: "18px 36px",
      borderRadius: "6px",
      textDecoration: "none",
      boxShadow: "0 8px 32px -8px rgba(201, 168, 76, 0.4)",
    }}
  >
    {children}
  </a>
);

const benefits = [
  { title: "Lifetime Free Access", body: "Never pay a monthly fee. Ever." },
  { title: "Your Own Domain", body: "Publish your course on your brand, not ours." },
  { title: "Keep 100% of Revenue", body: "0% revenue share. Every dollar is yours." },
];

const asks = [
  "Ship 1 public course on your Excellion domain",
  "Share 1 honest testimonial",
  "Let us share your results (with your permission)",
];

const Founding = () => {
  const filledPct = ((SPOTS_TOTAL - SPOTS_REMAINING) / SPOTS_TOTAL) * 100;

  return (
    <div style={{ backgroundColor: BG, color: TEXT, minHeight: "100vh" }} className="overflow-x-hidden">
      <Navigation />

      {/* HERO */}
      <section className="w-full" style={{ paddingTop: "120px", paddingBottom: "96px" }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "900px" }}>
          <div
            style={{
              display: "inline-block",
              fontFamily: bodyFont,
              fontSize: "12px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GOLD,
              border: `1px solid ${GOLD}`,
              padding: "8px 16px",
              borderRadius: "999px",
              marginBottom: "32px",
            }}
          >
            Founding Coach Program
          </div>
          <h1
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(36px, 6vw, 56px)",
              lineHeight: 1.1,
              color: TEXT,
              marginBottom: "24px",
              fontWeight: 600,
            }}
          >
            Become a Founding Coach.
          </h1>
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: "20px",
              lineHeight: 1.5,
              color: TEXT,
              opacity: 0.85,
              marginBottom: "40px",
            }}
          >
            10 spots. Lifetime free access. Your course, your domain, your revenue.
          </p>
          <GoldButton>Apply for a Founding Spot</GoldButton>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <SocialProofFounding claimed={SPOTS_TOTAL - SPOTS_REMAINING} total={SPOTS_TOTAL} />

      {/* WHAT YOU GET */}
      <section className="w-full" style={{ paddingTop: "64px", paddingBottom: "96px" }}>
        <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
          <h2
            className="text-center"
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(28px, 4vw, 40px)",
              color: TEXT,
              marginBottom: "56px",
              fontWeight: 600,
            }}
          >
            What You Get
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "32px" }}>
            {benefits.map((b) => (
              <div
                key={b.title}
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "12px",
                  padding: "40px 32px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: headingFont,
                    fontSize: "24px",
                    color: GOLD,
                    marginBottom: "16px",
                    fontWeight: 600,
                  }}
                >
                  {b.title}
                </div>
                <div
                  style={{
                    fontFamily: bodyFont,
                    fontSize: "16px",
                    color: TEXT,
                    opacity: 0.8,
                    lineHeight: 1.5,
                  }}
                >
                  {b.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT WE ASK */}
      <section className="w-full" style={{ paddingTop: "64px", paddingBottom: "96px" }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "720px" }}>
          <h2
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(28px, 4vw, 40px)",
              color: TEXT,
              marginBottom: "16px",
              fontWeight: 600,
            }}
          >
            What We Ask
          </h2>
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: "18px",
              color: TEXT,
              opacity: 0.8,
              marginBottom: "40px",
            }}
          >
            In exchange, we ask for 3 things:
          </p>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {asks.map((ask, i) => (
              <li
                key={ask}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "20px",
                  padding: "20px 24px",
                  backgroundColor: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    fontFamily: headingFont,
                    fontSize: "24px",
                    color: GOLD,
                    minWidth: "32px",
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontFamily: bodyFont,
                    fontSize: "16px",
                    color: TEXT,
                    lineHeight: 1.5,
                  }}
                >
                  {ask}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SCARCITY BAR */}
      <section className="w-full" style={{ paddingTop: "64px", paddingBottom: "96px" }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "720px" }}>
          <div
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(28px, 4vw, 40px)",
              color: TEXT,
              marginBottom: "32px",
              fontWeight: 600,
            }}
          >
            <span style={{ color: GOLD }}>{SPOTS_REMAINING}</span> of {SPOTS_TOTAL} spots remaining
          </div>
          <div
            role="progressbar"
            aria-valuenow={SPOTS_TOTAL - SPOTS_REMAINING}
            aria-valuemin={0}
            aria-valuemax={SPOTS_TOTAL}
            style={{
              width: "100%",
              height: "12px",
              backgroundColor: "hsl(38 10% 14%)",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "20px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div
              style={{
                width: `${filledPct}%`,
                height: "100%",
                backgroundColor: GOLD,
                boxShadow: `0 0 16px ${GOLD}`,
                borderRadius: "999px",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: bodyFont,
              fontSize: "14px",
              color: MUTED,
              letterSpacing: "0.02em",
            }}
          >
            Once these spots are gone, they are gone forever.
          </p>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="w-full" style={{ paddingTop: "64px", paddingBottom: "120px" }}>
        <div className="mx-auto px-6 text-center" style={{ maxWidth: "720px" }}>
          <h2
            style={{
              fontFamily: headingFont,
              fontSize: "clamp(32px, 5vw, 48px)",
              color: TEXT,
              marginBottom: "32px",
              lineHeight: 1.15,
              fontWeight: 600,
            }}
          >
            Ready to build something that is yours?
          </h2>
          <GoldButton>Claim Your Founding Spot</GoldButton>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Founding;