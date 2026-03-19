import { Coins } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreditBalanceProps {
  credits: number;
  className?: string;
}

const CreditBalance = ({ credits, className }: CreditBalanceProps) => (
  <Badge variant="outline" className={`gap-1 text-xs font-normal ${className ?? ""}`}>
    <Coins className="h-3 w-3 text-primary" />
    <span className="text-foreground">{credits.toLocaleString()}</span>
    <span className="text-muted-foreground">credits</span>
  </Badge>
);

export default CreditBalance;
