import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomDomainsPanelProps {
  courseId: string | null;
  currentDomain?: string | null;
  onDomainChange?: (domain: string | null) => void;
}

const CustomDomainsPanel = ({ courseId, currentDomain, onDomainChange }: CustomDomainsPanelProps) => {
  const [domain, setDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!domain.trim() || !courseId) return;
    setIsAdding(true);
    const { error } = await supabase
      .from("courses")
      .update({ custom_domain: domain.trim(), updated_at: new Date().toISOString() })
      .eq("id", courseId);
    setIsAdding(false);
    if (error) { toast.error("Failed to add domain"); return; }
    toast.success("Domain added");
    onDomainChange?.(domain.trim());
    setDomain("");
  };

  const handleRemove = async () => {
    if (!courseId) return;
    await supabase.from("courses").update({ custom_domain: null, domain_verified: false }).eq("id", courseId);
    onDomainChange?.(null);
    toast.success("Domain removed");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Globe className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Custom Domains</h3>
      </div>

      {currentDomain ? (
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-between py-3 px-4">
            <div>
              <p className="text-sm font-medium text-foreground">{currentDomain}</p>
              <Badge variant="secondary" className="mt-1 text-xs">Active</Badge>
            </div>
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={handleRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-2">
          <Input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mycourse.com" className="flex-1" />
          <Button onClick={handleAdd} disabled={isAdding || !domain.trim() || !courseId} size="sm">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomDomainsPanel;
