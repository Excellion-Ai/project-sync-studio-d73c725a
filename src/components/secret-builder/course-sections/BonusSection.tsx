import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Gift } from "lucide-react";

export interface BonusItem {
  id: string;
  title: string;
  description: string;
  value: string;
}

interface BonusSectionProps {
  bonuses: BonusItem[];
  onUpdate: (bonuses: BonusItem[]) => void;
}

const BonusSection = ({ bonuses, onUpdate }: BonusSectionProps) => {
  const addBonus = () => {
    onUpdate([...bonuses, { id: crypto.randomUUID(), title: "", description: "", value: "" }]);
  };

  const updateItem = (id: string, field: keyof BonusItem, value: string) => {
    onUpdate(bonuses.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  const removeItem = (id: string) => {
    onUpdate(bonuses.filter((b) => b.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Bonuses</h3>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addBonus}>
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>

      {bonuses.map((b) => (
        <Card key={b.id} className="p-3 space-y-2">
          <div className="flex gap-2">
            <Input value={b.title} onChange={(e) => updateItem(b.id, "title", e.target.value)} placeholder="Bonus title" className="flex-1" />
            <Input value={b.value} onChange={(e) => updateItem(b.id, "value", e.target.value)} placeholder="$99 value" className="w-24" />
            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(b.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input value={b.description} onChange={(e) => updateItem(b.id, "description", e.target.value)} placeholder="Description" />
        </Card>
      ))}

      {bonuses.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No bonuses added yet</p>
      )}
    </div>
  );
};

export default BonusSection;
