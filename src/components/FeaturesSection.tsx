import { motion } from "framer-motion";
import { FileText, GraduationCap, Link2, ClipboardList, Dumbbell, BarChart3 } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Course Sales Page (Drafted for You)",
    description: "A ready-to-edit sales page that explains who the course is for, the outcome, what's included, and how to enroll.",
  },
  {
    icon: GraduationCap,
    title: "Student Portal Included",
    description: "Give students a clean place to access lessons, follow the plan, and stay on track.",
  },
  {
    icon: Link2,
    title: "Publish on Your Link or Domain",
    description: "Go live on your link or your own domain when you're ready.",
  },
  {
    icon: ClipboardList,
    title: "Student Intake + Check-ins",
    description: "Collect goals, starting point, preferences, and ongoing updates without chasing messages.",
  },
  {
    icon: Dumbbell,
    title: "Built for Real Fitness Niches",
    description: "Great for fat loss, strength, muscle gain, postpartum, runners, busy professionals, and beginners.",
  },
  {
    icon: BarChart3,
    title: "Built-in Analytics",
    description: "See visits, clicks, and signups so you know what's working and what to improve.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-[60px] bg-[hsl(0_0%_5%)] relative">
      {/* Radial glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[500px] bg-[radial-gradient(ellipse,hsl(43_52%_54%/0.06)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Built for fitness influencers</h2>
          <p className="text-muted-foreground text-lg font-body">Create, sell, and deliver a course in one place.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="premium-card p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-heading font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-body">{f.description}</p>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-muted-foreground text-sm mt-8 font-body">Included with every plan</p>
      </div>
    </section>
  );
};

export default FeaturesSection;
