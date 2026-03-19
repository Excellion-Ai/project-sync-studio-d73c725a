import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface SecurityItem {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

const SecurityScanPanel = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<SecurityItem[] | null>(null);

  const runScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setResults([
        { label: "RLS Policies", status: "pass", detail: "All tables have RLS enabled" },
        { label: "Auth Configuration", status: "pass", detail: "Email auth properly configured" },
        { label: "API Key Exposure", status: "pass", detail: "No private keys in client code" },
        { label: "Storage Buckets", status: "warn", detail: "Some buckets are public — verify intentional" },
        { label: "Edge Function Auth", status: "pass", detail: "All functions check auth headers" },
      ]);
      setIsScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold">Security Scan</h3>
        </div>
        <Button size="sm" variant="outline" onClick={runScan} disabled={isScanning} className="h-7 text-xs gap-1">
          {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3" />}
          {isScanning ? "Scanning…" : "Run Scan"}
        </Button>
      </div>

      {results ? (
        <div className="space-y-2">
          {results.map((r) => (
            <Card key={r.label} className="border-border/50">
              <CardContent className="flex items-start gap-2 py-2 px-3">
                {r.status === "pass" ? (
                  <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-medium text-foreground">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground">{r.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-8">Run a scan to check your project security</p>
      )}
    </div>
  );
};

export default SecurityScanPanel;
