import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Globe, Trash2, RefreshCw, Loader2, CheckCircle2, Clock, ExternalLink, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomDomainsPanelProps {
  courseId: string | null;
  currentDomain?: string | null;
  domainVerified?: boolean;
  onDomainChange?: (domain: string | null, verified: boolean) => void;
}

const DNS_PROVIDER_LINKS = [
  { name: "GoDaddy", url: "https://www.godaddy.com/help/add-a-cname-record-19236" },
  { name: "Namecheap", url: "https://www.namecheap.com/support/knowledgebase/article.aspx/9646/2237/how-to-create-a-cname-record-for-your-domain/" },
  { name: "Cloudflare", url: "https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/" },
  { name: "Google Domains", url: "https://support.google.com/domains/answer/9211383" },
];

function validateDomain(input: string): string | null {
  const cleaned = input.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
  if (!cleaned) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(cleaned)) return null;
  return cleaned;
}

const CustomDomainsPanel = ({ courseId, currentDomain, domainVerified, onDomainChange }: CustomDomainsPanelProps) => {
  const [domainInput, setDomainInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [verified, setVerified] = useState(domainVerified ?? false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { setVerified(domainVerified ?? false); }, [domainVerified]);

  const handleAddDomain = async () => {
    const clean = validateDomain(domainInput);
    if (!clean || !courseId) {
      toast.error("Please enter a valid domain (e.g. courses.mysite.com)");
      return;
    }
    setIsAdding(true);
    const token = `excellion-${courseId.slice(0, 8)}`;
    const { error } = await supabase
      .from("courses")
      .update({
        custom_domain: clean,
        domain_verified: false,
        domain_verification_token: token,
        domain_verified_at: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", courseId);
    setIsAdding(false);
    if (error) { toast.error("Failed to add domain"); return; }
    setVerified(false);
    setDomainInput("");
    onDomainChange?.(clean, false);
    toast.success("Domain added — configure DNS records below");
  };

  const handleVerify = async () => {
    if (!courseId || !currentDomain) return;
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-domain-dns", {
        body: { domain: currentDomain, courseId },
      });
      if (error) throw error;
      if (data?.verified) {
        setVerified(true);
        onDomainChange?.(currentDomain, true);
        toast.success("Domain verified! Your course is live at https://" + currentDomain);
      } else {
        const details = [];
        if (!data?.aVerified) details.push("CNAME/A record not found");
        if (!data?.txtVerified) details.push("TXT verification record not found");
        toast.error(`Verification failed: ${details.join(", ") || "DNS records not detected yet"}`);
      }
    } catch {
      toast.error("Verification failed — please try again");
    }
    setIsVerifying(false);
  };

  const handleRemove = async () => {
    if (!courseId) return;
    setIsRemoving(true);
    const { error } = await supabase
      .from("courses")
      .update({
        custom_domain: null,
        domain_verified: false,
        domain_verification_token: null,
        domain_verified_at: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", courseId);
    setIsRemoving(false);
    if (error) { toast.error("Failed to remove domain"); return; }
    setVerified(false);
    onDomainChange?.(null, false);
    toast.success("Domain removed");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSubdomain = currentDomain?.split(".").length === 3;

  // ── No domain configured ──────────────────────────────────
  if (!currentDomain) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold text-foreground">Custom Domain</Label>
        </div>
        <div className="flex gap-2">
          <Input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="courses.yourdomain.com"
            onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
          />
          <Button onClick={handleAddDomain} disabled={isAdding || !domainInput.trim() || !courseId} size="sm">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Connect your own domain so students visit your branded URL instead of excellioncourses.com
        </p>
      </div>
    );
  }

  // ── Domain configured ─────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        <Label className="text-sm font-semibold text-foreground">Custom Domain</Label>
      </div>

      {/* Domain display + status */}
      <Card className="border-border/50">
        <CardContent className="py-3 px-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-foreground truncate">{currentDomain}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleCopy(`https://${currentDomain}`)}>
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {verified ? (
                <Badge className="bg-emerald-600 text-white text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Clock className="h-3 w-3" /> Pending
                </Badge>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove custom domain?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will disconnect <strong>{currentDomain}</strong>. Your course will still be available at the default Excellion URL.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} disabled={isRemoving}>
                      {isRemoving ? "Removing..." : "Remove Domain"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {verified && (
            <p className="text-xs text-emerald-400">
              Your course is live at{" "}
              <a href={`https://${currentDomain}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                https://{currentDomain}
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* DNS Instructions (shown when not yet verified) */}
      {!verified && (
        <Card className="border-border/50">
          <CardContent className="pt-4 space-y-3">
            <p className="text-xs font-medium text-foreground">Add this DNS record at your domain provider:</p>

            <div className="text-xs font-mono space-y-1.5">
              <div className="grid grid-cols-3 gap-2 text-muted-foreground font-sans font-medium border-b border-border pb-1">
                <span>Type</span><span>Name</span><span>Value</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-foreground">
                <span>{isSubdomain ? "CNAME" : "CNAME"}</span>
                <span>{isSubdomain ? currentDomain.split(".")[0] : "@"}</span>
                <span>excellioncourses.com</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-foreground">
                <span>TXT</span>
                <span>_verify</span>
                <span>excellion-{courseId?.slice(0, 8)}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground">
              DNS changes can take up to 48 hours to propagate.
            </p>

            <Button size="sm" variant="outline" onClick={handleVerify} disabled={isVerifying} className="w-full">
              {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
              {isVerifying ? "Checking DNS..." : "Verify Domain"}
            </Button>

            {/* Provider links */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5">DNS setup guides:</p>
              <div className="flex flex-wrap gap-1.5">
                {DNS_PROVIDER_LINKS.map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                  >
                    {p.name} <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomDomainsPanel;
