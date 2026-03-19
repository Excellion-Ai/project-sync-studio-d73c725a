import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

interface GuaranteeSectionProps {
  headline: string;
  body: string;
  daysRefund: number;
  onUpdate: (field: "headline" | "body" | "daysRefund", value: string | number) => void;
}

const GuaranteeSection = ({ headline, body, daysRefund, onUpdate }: GuaranteeSectionProps) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-foreground">
      <ShieldCheck className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold">Guarantee</h3>
    </div>
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground">Headline</Label>
        <Input value={headline} onChange={(e) => onUpdate("headline", e.target.value)} placeholder="100% Money-Back Guarantee" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground">Body</Label>
        <Textarea value={body} onChange={(e) => onUpdate("body", e.target.value)} placeholder="If you're not satisfied…" rows={3} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-foreground">Refund Period (days)</Label>
        <Input type="number" min={0} value={daysRefund} onChange={(e) => onUpdate("daysRefund", parseInt(e.target.value) || 0)} />
      </div>
    </div>
  </div>
);

export default GuaranteeSection;
