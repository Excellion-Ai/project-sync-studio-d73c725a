import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Zap } from "lucide-react";

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
}

interface FeaturesSectionProps {
  features: FeatureItem[];
  onUpdate: (features: FeatureItem[]) => void;
}

const FeaturesSection = ({ features, onUpdate }: FeaturesSectionProps) => {
  const addFeature = () => {
    onUpdate([...features, { id: crypto.randomUUID(), title: "", description: "" }]);
  };

  const updateItem = (id: string, field: keyof FeatureItem, value: string) => {
    onUpdate(features.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const removeItem = (id: string) => {
    onUpdate(features.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Features</h3>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addFeature}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {features.map((f) => (
        <Card key={f.id} className="p-3 flex gap-2">
          <div className="flex-1 space-y-2">
            <Input value={f.title} onChange={(e) => updateItem(f.id, "title", e.target.value)} placeholder="Feature title" />
            <Input value={f.description} onChange={(e) => updateItem(f.id, "description", e.target.value)} placeholder="Short description" />
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(f.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </Card>
      ))}

      {features.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No features added yet</p>
      )}
    </div>
  );
};

export default FeaturesSection;
