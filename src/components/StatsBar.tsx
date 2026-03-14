import { motion } from "framer-motion";

const stats = [
  { icon: "◈", title: "Launch This Weekend", subtitle: "Go from idea to live course in hours" },
  { icon: "▸", title: "Built for Fitness Creators", subtitle: "Designed specifically for coaches and influencers" },
  { icon: "✦", title: "No Tech Skills Needed", subtitle: "If you can type a sentence you can build a course" },
  { icon: "✦", title: "Sell Directly to Your Audience", subtitle: "No middleman, no marketplace, just you and your students" },
];

const StatsBar = () => {
  return (
    <section className="py-16 bg-background relative radial-glow">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-lg sm:text-xl font-heading font-black text-gradient-gold mb-1">
                {stat.title}
              </div>
              <div className="text-sm text-muted-foreground font-body">
                {stat.subtitle}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
