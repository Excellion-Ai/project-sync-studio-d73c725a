const stats = [
  { value: "60 sec", label: "Average course build time" },
  { value: "0%", label: "Revenue share. Keep every dollar." },
  { value: "$79/mo", label: "Flat pricing. Kajabi is $500." },
];

const SocialProofBlock = () => {
  return (
    <section
      className="w-full overflow-hidden"
      style={{
        backgroundColor: "hsl(38 10% 6%)",
        paddingTop: "80px",
        paddingBottom: "80px",
        color: "hsl(40 30% 92%)",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        {/* Row 1: Headline */}
        <h2
          className="text-center font-heading"
          style={{
            fontFamily: '"Playfair Display", serif',
            fontSize: "clamp(32px, 5vw, 48px)",
            lineHeight: 1.15,
            color: "hsl(40 30% 92%)",
            marginBottom: "64px",
          }}
        >
          Built for fitness coaches who are done renting their business.
        </h2>

        {/* Row 2: Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: "40px", marginBottom: "72px" }}>
          {stats.map((s) => (
            <div
              key={s.label}
              className="text-center transition-transform duration-200 ease-out hover:scale-[1.02]"
            >
              <div
                style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: "56px",
                  lineHeight: 1,
                  color: "#C9A84C",
                  marginBottom: "16px",
                  fontWeight: 600,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "hsl(40 30% 92%)",
                  opacity: 0.85,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Row 3: Trust strip */}
        <div className="flex flex-wrap items-center justify-center" style={{ gap: "40px" }}>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "hsl(40 8% 55%)",
            }}
          >
            Powered by
          </span>
          <img
            src="https://supabase.com/brand-assets/logo/supabase-logo-wordmark--light.svg"
            alt="Supabase"
            style={{ height: "32px", opacity: 0.7, filter: "grayscale(100%)" }}
            loading="lazy"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"
            alt="Stripe"
            style={{ height: "32px", opacity: 0.7, filter: "grayscale(100%) brightness(2.5)" }}
            loading="lazy"
          />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/7/78/Anthropic_logo.svg"
            alt="Anthropic Claude"
            style={{ height: "32px", opacity: 0.7, filter: "grayscale(100%) brightness(2.5)" }}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
};

export default SocialProofBlock;