const stats = [
  { value: "60 sec", label: "To your first draft. Perfect it from there." },
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
          {/* Supabase wordmark */}
          <svg
            role="img"
            aria-label="Supabase"
            viewBox="0 0 581 113"
            style={{ height: "32px", width: "auto", opacity: 0.75 }}
            fill="hsl(40 20% 80%)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M65.6 109.7c-2.9 3.7-8.9 1.7-9-3L55.2 38h46.5c8.4 0 13.1 9.7 7.9 16.3l-44 55.4z"/>
            <path d="M44.5 3.3c2.9-3.7 8.9-1.7 9 3L54.9 75H9c-8.4 0-13.1-9.7-7.9-16.3l43.4-55.4z" opacity="0.6"/>
            <text x="135" y="78" fontFamily="Inter, sans-serif" fontSize="56" fontWeight="600" fill="hsl(40 20% 80%)">Supabase</text>
          </svg>

          {/* Stripe wordmark */}
          <svg
            role="img"
            aria-label="Stripe"
            viewBox="0 0 200 80"
            style={{ height: "32px", width: "auto", opacity: 0.75 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <text x="0" y="60" fontFamily="Inter, sans-serif" fontSize="60" fontWeight="700" fill="hsl(40 20% 80%)" letterSpacing="-2">stripe</text>
          </svg>

          {/* Anthropic wordmark */}
          <svg
            role="img"
            aria-label="Anthropic"
            viewBox="0 0 260 80"
            style={{ height: "32px", width: "auto", opacity: 0.75 }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M40 12 L20 60 L30 60 L34 50 L52 50 L56 60 L66 60 L46 12 Z M37 42 L43 26 L49 42 Z" fill="hsl(40 20% 80%)"/>
            <text x="78" y="56" fontFamily="Inter, sans-serif" fontSize="42" fontWeight="500" fill="hsl(40 20% 80%)">Anthropic</text>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default SocialProofBlock;