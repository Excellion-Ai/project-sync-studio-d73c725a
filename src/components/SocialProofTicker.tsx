const messages = [
  "Sarah K. launched her 8-week course this weekend",
  "Mike R. made $4,200 in 48 hours",
  "Jessica T. enrolled 120 students in her first week",
  "David M. built his course in just 6 hours",
  "Amanda L. replaced her 9-5 income with course sales",
  "Chris P. scaled to $12K/month with one course",
  "Rachel W. launched her postpartum fitness program overnight",
  "James B. went from idea to 500 students in 30 days",
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
