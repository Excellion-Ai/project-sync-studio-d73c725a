const messages = [
  "✦ Generate a full course from 1 prompt",
  "✦ AI writes your entire course outline automatically",
  "✦ Publish on your own custom domain",
  "✦ Built specifically for fitness influencers and coaches",
  "✦ No technical skills required to launch",
  "✦ Go from idea to live course in one weekend",
  "✦ Your audience already trusts you — now monetize it",
  "✦ One course can earn while you sleep every night",
];

const SocialProofTicker = () => {
  return (
    <section className="py-4 bg-[hsl(0_0%_5%)] border-y border-border overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...messages, ...messages].map((msg, i) => (
          <span key={i} className="inline-flex items-center gap-3 mx-8 text-sm text-muted-foreground font-body">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            {msg}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SocialProofTicker;
