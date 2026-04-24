import { useEffect, useRef, useState } from "react";
import { KeyRound, Activity, Unlink2 } from "lucide-react";

const GOLD = "#C9A84C";
const BG_BASE = "hsl(38 10% 6%)";
const BG_ELEV_1 = "hsl(38 10% 9%)";
const BORDER_SUBTLE = "hsl(40 15% 18%)";
const BODY = "hsl(40 30% 92%)";
const GOLD_TRACK = "hsl(42 55% 48% / 0.15)";
const FONT_DISPLAY = '"Playfair Display", serif';
const FONT_BODY = '"DM Sans", sans-serif';

type Props = {
  claimed?: number;
  total?: number;
  founderPhoto?: string;
  shipCadenceLine?: string;
  tiktokUrl?: string;
  xUrl?: string;
};

const cards = [
  {
    Icon: KeyRound,
    title: "You don't own Kajabi's checkout.",
    body: "Platforms own your customer list, your URL, and your brand experience. When they raise prices or change rules, your business changes with them. Your domain should be yours.",
  },
  {
    Icon: Activity,
    title: "Clients go quiet. Revenue goes with them.",
    body: "Every coach loses clients not to competition but to silence. Accountability is the product. That's why the check-in system ships in May, built into every course on Excellion.",
  },
  {
    Icon: Unlink2,
    title: "A link in bio is not a business.",
    body: "Screenshots, DMs, Google Docs, Stripe payment links. Coaches who make real money own the whole flow. One domain, one checkout, one place clients return to.",
  },
];

const StaggerCard = ({
  index,
  Icon,
  title,
  body,
}: {
  index: number;
  Icon: typeof KeyRound;
  title: string;
  body: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 60);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      className="md:hover:border-[color:var(--gold-hover)] transition-colors duration-200"
      style={
        {
          backgroundColor: BG_ELEV_1,
          border: `1px solid ${BORDER_SUBTLE}`,
          borderRadius: "16px",
          padding: "32px",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition:
            "opacity 500ms ease-out, transform 500ms ease-out, border-color 200ms ease-out",
          ["--gold-hover" as string]: "rgba(201, 168, 76, 0.4)",
        } as React.CSSProperties
      }
    >
      <Icon size={24} color={GOLD} style={{ marginBottom: "24px" }} />
      <h3
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: "22px",
          fontWeight: 400,
          color: BODY,
          marginBottom: "12px",
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: FONT_BODY,
          fontSize: "15px",
          color: BODY,
          opacity: 0.8,
          lineHeight: 1.6,
          fontWeight: 400,
        }}
      >
        {body}
      </p>
    </div>
  );
};

const GhostButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="transition-colors duration-200 hover:bg-[#C9A84C] hover:text-[hsl(38_30%_8%)]"
    style={{
      border: `1px solid ${GOLD}`,
      color: GOLD,
      padding: "12px 20px",
      borderRadius: "999px",
      fontFamily: FONT_BODY,
      fontSize: "14px",
      fontWeight: 500,
      textDecoration: "none",
      display: "inline-block",
    }}
  >
    {children}
  </a>
);

const SocialProofFounding = ({
  claimed = 0,
  total = 10,
  founderPhoto = "",
  shipCadenceLine = "Shipped daily since April 1. No VC. No marketing budget.",
  tiktokUrl = "https://www.tiktok.com/",
  xUrl = "https://x.com/",
}: Props) => {
  const pct = Math.max(0, Math.min(100, (claimed / total) * 100));

  return (
    <section
      id="social-proof"
      className="w-full py-24 md:py-32"
      style={{ backgroundColor: BG_BASE }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1120px" }}>
        {/* 1. EYEBROW + HEADLINE */}
        <div className="mx-auto text-center" style={{ maxWidth: "680px" }}>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GOLD,
              fontWeight: 500,
              marginBottom: "20px",
            }}
          >
            Who this is for
          </div>
          <h2
            className="text-[32px] leading-[40px] md:text-[48px] md:leading-[56px]"
            style={{
              fontFamily: FONT_DISPLAY,
              color: BODY,
              fontWeight: 400,
              marginBottom: "20px",
            }}
          >
            Coaches who want their audience back.
          </h2>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "18px",
              color: BODY,
              opacity: 0.8,
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            Not another platform to rent. Not another $500 monthly bill. The first 10
            coaches build on their own domain, free for life.
          </p>
        </div>

        {/* 2. SPOT COUNTER */}
        <div
          className="text-center mt-20 relative"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 50% 20%, hsl(42 55% 48% / 0.08), transparent 60%)",
          }}
        >
          <div
            className="text-[72px] md:text-[96px] leading-none"
            style={{
              fontFamily: FONT_DISPLAY,
              color: GOLD,
              fontWeight: 400,
            }}
          >
            {claimed} / {total}
          </div>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontSize: "16px",
              color: BODY,
              marginTop: "8px",
              fontWeight: 400,
            }}
          >
            Founding Coach spots claimed
          </div>

          <div
            className="mx-auto"
            style={{
              maxWidth: "720px",
              width: "100%",
              height: "8px",
              backgroundColor: GOLD_TRACK,
              borderRadius: "999px",
              marginTop: "32px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                backgroundColor: GOLD,
                borderRadius: "999px",
                transition: "width 600ms ease-out",
              }}
            />
          </div>
          <p
            style={{
              fontFamily: FONT_BODY,
              fontSize: "13px",
              color: BODY,
              opacity: 0.6,
              marginTop: "12px",
              fontWeight: 400,
            }}
          >
            Updates live. No fake countdowns.
          </p>
        </div>

        {/* 3. COACH-VOICE CARD ROW */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <StaggerCard
              key={c.title}
              index={i}
              Icon={c.Icon}
              title={c.title}
              body={c.body}
            />
          ))}
        </div>

        {/* 4. FOUNDER STRIP */}
        <div className="mt-24 flex flex-col md:flex-row items-center gap-6 md:justify-between">
          <div className="flex items-center gap-5">
            <div
              style={{
                width: "96px",
                height: "96px",
                borderRadius: "999px",
                border: `1px solid ${GOLD}`,
                overflow: "hidden",
                flexShrink: 0,
                backgroundColor: BG_ELEV_1,
              }}
            >
              {founderPhoto ? (
                <img
                  src={founderPhoto}
                  alt="John, founder of Excellion"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : null}
            </div>
            <div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "22px",
                  color: BODY,
                  fontWeight: 400,
                  lineHeight: 1.3,
                }}
              >
                Built by John, founder of Excellion.
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: "14px",
                  color: GOLD,
                  marginTop: "6px",
                  fontWeight: 500,
                }}
              >
                {shipCadenceLine}
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: "14px",
                  color: BODY,
                  opacity: 0.75,
                  marginTop: "4px",
                  fontWeight: 400,
                }}
              >
                Every update goes live on TikTok and X first. You can watch it ship in
                real time.
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <GhostButton href={tiktokUrl}>Watch on TikTok</GhostButton>
            <GhostButton href={xUrl}>Follow on X</GhostButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofFounding;