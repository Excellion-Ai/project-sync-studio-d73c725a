import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Can I really launch in 1 weekend?",
    a: "Yes. Excellion generates your course outline, lesson structure, sales page copy, and student portal from a single prompt. You spend the weekend reviewing, filming if needed, and publishing.",
  },
  {
    q: "What types of fitness courses can I create?",
    a: "Any fitness niche works — fat loss, strength training, muscle gain, postpartum, running, home workouts, beginner programs, and more. Excellion adapts to your audience and goals.",
  },
  {
    q: "Do I need technical skills?",
    a: "Not at all. Everything is generated and managed through simple prompts and an intuitive editor. No coding, no design skills needed.",
  },
  {
    q: "Can I use my own domain?",
    a: "Yes. You can publish on your Excellion link or connect your own custom domain at any time.",
  },
  {
    q: "How does pricing work?",
    a: "Start for $19 your first month, then $79/month or $790/year. Everything is included — courses, student portal, analytics, custom domain, and more. Cancel anytime.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-[60px] bg-background relative radial-glow">
      <div className="max-w-2xl mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground font-body">Everything you need to know about Excellion</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="premium-card px-6 border-none">
                <AccordionTrigger className="text-foreground text-sm font-heading font-semibold hover:no-underline hover:text-primary py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed font-body pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
