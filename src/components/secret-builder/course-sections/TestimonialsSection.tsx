import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Star } from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
  onUpdate: (testimonials: Testimonial[]) => void;
}

const TestimonialsSection = ({ testimonials, onUpdate }: TestimonialsSectionProps) => {
  const addTestimonial = () => {
    onUpdate([...testimonials, { id: crypto.randomUUID(), name: "", role: "", content: "", rating: 5 }]);
  };

  const updateItem = (id: string, field: keyof Testimonial, value: string | number) => {
    onUpdate(testimonials.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const removeItem = (id: string) => {
    onUpdate(testimonials.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Testimonials</h3>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addTestimonial}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {testimonials.map((t) => (
        <Card key={t.id} className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input value={t.name} onChange={(e) => updateItem(t.id, "name", e.target.value)} placeholder="Name" className="flex-1" />
            <Input value={t.role} onChange={(e) => updateItem(t.id, "role", e.target.value)} placeholder="Role" className="flex-1" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(t.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Textarea value={t.content} onChange={(e) => updateItem(t.id, "content", e.target.value)} placeholder="Testimonial text…" rows={2} />
        </Card>
      ))}

      {testimonials.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No testimonials yet</p>
      )}
    </div>
  );
};

export default TestimonialsSection;
