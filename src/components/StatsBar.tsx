import { motion } from "framer-motion";

const stats = [
  { number: "2,400+", label: "Courses Launched" },
  { number: "$8.2M", label: "Revenue Earned" },
  { number: "6hrs", label: "Average Launch Time" },
  { number: "4.9★", label: "Creator Rating" },
];

const StatsBar = () => {
  return (
    <section className="py-16 bg-background relative radial-glow">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-heading font-black text-gradient-gold mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-muted-foreground font-body">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
