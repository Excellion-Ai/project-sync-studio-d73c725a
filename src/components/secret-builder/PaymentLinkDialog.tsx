import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STRIPE_LINK_PREFIX = "https://buy.stripe.com/";

interface PaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUrl: string | null;
  onSave: (url: string | null) => Promise<void> | void;
}

const PaymentLinkDialog = ({ open, onOpenChange, currentUrl, onSave }: PaymentLinkDialogProps) => {
  const [value, setValue] = useState(currentUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Prefill with existing value each time the dialog opens
  useEffect(() => {
    if (open) {
      setValue(currentUrl ?? "");
      setError(null);
    }
  }, [open, currentUrl]);

  const handleSave = async () => {
    const trimmed = value.trim();

    // Empty input clears the link — treat as null.
    if (!trimmed) {
      setSaving(true);
      try {
        await onSave(null);
        onOpenChange(false);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (!trimmed.startsWith(STRIPE_LINK_PREFIX)) {
      setError("Must be a valid Stripe Payment Link (starts with buy.stripe.com)");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stripe Payment Link</DialogTitle>
          <DialogDescription>
            Create a Payment Link in your Stripe dashboard and paste it here.
            Your students will be redirected there when they click Enroll Now.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="stripe-payment-url" className="text-sm">
              Paste your Stripe Payment Link
            </Label>
            <Input
              id="stripe-payment-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder="https://buy.stripe.com/..."
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              className={error ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <a
            href="https://stripe.com/docs/payment-links"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            What's a Payment Link? <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentLinkDialog;
