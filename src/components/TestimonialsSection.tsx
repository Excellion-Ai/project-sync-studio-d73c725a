import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "I went from 'I should make a course' to actually having students enrolled — in one weekend. Excellion made it stupidly easy.",
    name: "Sarah K.",
    title: "Online Fitness Coach",
    followers: "48K followers",
  },
  {
    quote: "The AI built my entire sales page and course outline. I just filmed the workouts and hit publish. Made $4,200 in the first 48 hours.",
    name: "Mike R.",
    title: "Strength Coach",
    followers: "125K followers",
  },
  {
    quote: "I've tried Teachable, Kajabi, all of them. Nothing got me from zero to launched this fast. My students love the portal too.",
    name: "Jessica T.",
    title: "Yoga Instructor",
    followers: "92K followers",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background relative radial-glow">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Trusted by creators who ship
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Real results from real fitness creators
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="premium-card p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground italic text-sm leading-relaxed mb-6 flex-1 font-body">
                "{t.quote}"
              </p>
              <div>
                <div className="text-foreground font-semibold text-sm font-body">{t.name}</div>
                <div className="text-muted-foreground text-xs font-body">{t.title} · {t.followers}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
